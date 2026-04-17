/**
 * Integration smoke tests for the hardened backend.
 * Run from the backend directory: node test-validation.js
 */
const BASE = 'http://localhost:5555';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(label, condition, got) {
  if (condition) {
    console.log(`  ✅ PASS — ${label}`);
  } else {
    console.error(`  ❌ FAIL — ${label}`, got);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('\n🧪 RedThread backend validation tests\n');

  // 1. Health check
  {
    const { status, data } = await req('GET', '/api/health');
    assert('Health check returns 200', status === 200, status);
    assert('Health check success:true', data.success === true, data);
  }

  // 2. Auth validation — missing/invalid fields
  {
    const { status, data } = await req('POST', '/api/auth/register', {
      username: 'ab',         // too short
      email: 'not-an-email',  // invalid
      password: '123',        // too short
    });
    assert('Register: bad fields → 400', status === 400, status);
    assert('Register: message present', typeof data.message === 'string', data);
    assert('Register: success:false', data.success === false, data);
    console.log('    message:', data.message);
  }

  // 3. Register valid user → get token
  let token;
  {
    const { status, data } = await req('POST', '/api/auth/register', {
      username: 'smoketester',
      email: 'smoketester@test.com',
      password: 'password123',
    });
    if (status === 400 && data.message?.includes('already taken')) {
      // Already exists — login instead
      const login = await req('POST', '/api/auth/login', {
        email: 'smoketester@test.com',
        password: 'password123',
      });
      assert('Login returns 200', login.status === 200, login.status);
      token = login.data.data?.token;
    } else {
      assert('Register valid user → 201', status === 201, status);
      token = data.data?.token;
    }
    assert('Token received', Boolean(token), 'no token');
  }

  // 4. Protected route without token → 401
  {
    const { status, data } = await req('GET', '/api/nodes');
    assert('No token → 401', status === 401, status);
    assert('success:false', data.success === false, data);
  }

  // 5. Node: empty title → 400
  {
    const { status, data } = await req('POST', '/api/nodes', { title: '', description: 'desc' }, token);
    assert('Empty title → 400', status === 400, status);
    console.log('    message:', data.message);
  }

  // 6. Node: missing description → 400
  {
    const { status, data } = await req('POST', '/api/nodes', { title: 'Test' }, token);
    assert('Missing description → 400', status === 400, status);
    console.log('    message:', data.message);
  }

  // 7. Create a valid node
  let nodeId1, nodeId2;
  {
    const { status, data } = await req('POST', '/api/nodes', {
      title: 'Node A',
      description: 'The first node',
      tags: ['tag1'],
    }, token);
    assert('Create node → 201', status === 201, status);
    nodeId1 = data.data?._id;
    assert('Node has _id', Boolean(nodeId1), data.data);
  }
  {
    const { status, data } = await req('POST', '/api/nodes', {
      title: 'Node B',
      description: 'The second node',
    }, token);
    assert('Create second node → 201', status === 201, status);
    nodeId2 = data.data?._id;
  }

  // 8. Thread: invalid ObjectId in fromNode/toNode → 400
  {
    const { status, data } = await req('POST', '/api/threads', {
      fromNode: 'not-a-real-id',
      toNode: 'also-not-real',
      type: 'influence',
    }, token);
    assert('Thread invalid ObjectId → 400', status === 400, status);
    console.log('    message:', data.message);
  }

  // 9. Thread: invalid type → 400
  {
    const { status, data } = await req('POST', '/api/threads', {
      fromNode: nodeId1,
      toNode: nodeId2,
      type: 'friendship',
    }, token);
    assert('Thread invalid type → 400', status === 400, status);
    console.log('    message:', data.message);
  }

  // 10. Thread: self-loop (fromNode === toNode) → 400
  {
    const { status, data } = await req('POST', '/api/threads', {
      fromNode: nodeId1,
      toNode: nodeId1,
      type: 'cause',
    }, token);
    assert('Thread self-loop → 400', status === 400, status);
    console.log('    message:', data.message);
  }

  // 11. Thread: nodes that don't exist → 404
  {
    const { status, data } = await req('POST', '/api/threads', {
      fromNode: '507f1f77bcf86cd799439099',
      toNode: '507f1f77bcf86cd799439098',
      type: 'cause',
    }, token);
    assert('Thread missing node → 404', status === 404, status);
    console.log('    message:', data.message);
  }

  // 12. Create valid thread
  let threadId;
  {
    const { status, data } = await req('POST', '/api/threads', {
      fromNode: nodeId1,
      toNode: nodeId2,
      type: 'influence',
      description: 'A connects to B',
    }, token);
    assert('Create thread → 201', status === 201, status);
    threadId = data.data?._id;
    assert('Thread has _id', Boolean(threadId), data.data);
  }

  // 13. Cascade delete: delete Node A → thread should also be gone
  {
    const { status, data } = await req('DELETE', `/api/nodes/${nodeId1}`, null, token);
    assert('Delete node → 200', status === 200, status);
    assert('threadsDeleted >= 1', data.threadsDeleted >= 1, data);
    console.log('    threadsDeleted:', data.threadsDeleted);
  }

  // 14. Thread should now be 404
  {
    const { status } = await req('GET', `/api/threads/${threadId}`, null, token);
    assert('Thread cascade deleted → 404', status === 404, status);
  }

  // 15. Invalid :id param → 400
  {
    const { status, data } = await req('GET', '/api/nodes/not-valid-id', null, token);
    assert('Invalid :id param → 400', status === 400, status);
    console.log('    message:', data.message);
  }

  // 16. Unknown route → 404
  {
    const { status, data } = await req('GET', '/api/doesnotexist');
    assert('Unknown route → 404', status === 404, status);
    assert('success:false on 404', data.success === false, data);
  }

  console.log('\n✅ Test suite complete.\n');
}

main().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
