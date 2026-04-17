/**
 * seed.js — RedThread database seeder
 *
 * Usage:
 *   node seed.js           — seed the database (clears existing data first)
 *   node seed.js --clear   — wipe all data without re-seeding
 *
 * Relies on the same .env as the main app.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ─── Models ───────────────────────────────────────────────────────────────────
const User           = require('./src/models/User');
const ConspiracyNode = require('./src/models/ConspiracyNode');
const RedThread      = require('./src/models/RedThread');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log  = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.warn(`  ⚠️  ${msg}`);
const err  = (msg) => console.error(`  ❌ ${msg}`);

// ─── Data ─────────────────────────────────────────────────────────────────────

const USERS = [
  { username: 'admin',      email: 'admin@test.com', password: 'password123' },
  { username: 'researcher', email: 'res@test.com',   password: 'password123' },
];

const buildNodes = (adminId, researcherId) => [
  {
    title: 'Moon Landing Hoax',
    description:
      'The Apollo moon landings were allegedly staged by NASA and the US government on a film set, ' +
      'possibly directed by Stanley Kubrick. Evidence cited includes waving flags, missing stars in ' +
      'photographs, and inconsistencies in radiation belt traversal.',
    tags: ['NASA', 'space', 'government', 'hoax'],
    createdBy: adminId,
  },
  {
    title: 'Flat Earth Theory',
    description:
      'A growing movement claims the Earth is a flat disc surrounded by an ice wall, with the ' +
      'dome protecting a sky dome. Governments and space agencies allegedly conspire to hide this ' +
      'truth from the public through fabricated satellite imagery and globe education.',
    tags: ['flat-earth', 'NASA', 'geography', 'cover-up'],
    createdBy: researcherId,
  },
  {
    title: 'Illuminati Control',
    description:
      'A secret society of elites — the Illuminati — allegedly controls world governments, banks, ' +
      'media, and entertainment. Symbols are hidden in plain sight across currency, logos, and ' +
      'architecture as signals to initiates.',
    tags: ['Illuminati', 'secret-society', 'elites', 'NWO'],
    createdBy: adminId,
  },
  {
    title: 'Area 51 Secrets',
    description:
      'The highly classified US Air Force installation in Nevada is believed to house crashed ' +
      'extraterrestrial spacecraft and alien bodies recovered from Roswell. Reverse-engineered alien ' +
      'technology is allegedly used to develop advanced military programs.',
    tags: ['Area51', 'aliens', 'USAF', 'classified'],
    createdBy: researcherId,
  },
  {
    title: '5G Mind Control',
    description:
      'Conspiracy theorists claim that 5G radio frequency towers emit signals capable of controlling ' +
      'human thought, enabling mass surveillance, and suppressing the immune system. Some allege ' +
      'coordination with global health organisations to accelerate rollout.',
    tags: ['5G', 'mind-control', 'RF', 'surveillance'],
    createdBy: adminId,
  },
  {
    title: 'Reptilian Elite',
    description:
      'Popularised by David Icke, this theory holds that shapeshifting reptilian aliens from ' +
      'the Alpha Draconis star system have infiltrated the highest levels of government, banking, ' +
      'and royalty, controlling human civilisation from within.',
    tags: ['reptilians', 'shapeshifters', 'elites', 'David-Icke'],
    createdBy: researcherId,
  },
  {
    title: 'Chemtrails',
    description:
      'Aircraft contrails are alleged to be chemical or biological agents deliberately sprayed ' +
      'at high altitude for purposes including weather modification, population control, and mass ' +
      'psychological manipulation. Governments deny the programme exists.',
    tags: ['chemtrails', 'geoengineering', 'weather', 'government'],
    createdBy: adminId,
  },
  {
    title: 'Time Travel Experiments',
    description:
      'The Philadelphia Experiment and Montauk Project are cited as evidence that the US military ' +
      'secretly achieved time travel and teleportation in the mid-20th century. Survivors claim ' +
      'the technology was later buried under black-budget programmes.',
    tags: ['time-travel', 'Philadelphia-Experiment', 'Montauk', 'black-budget'],
    createdBy: researcherId,
  },
  {
    title: 'NASA Cover-up',
    description:
      'NASA is alleged to routinely airbrush alien structures from Mars and Moon photographs, ' +
      'suppress evidence of extraterrestrial life, and fabricate mission data. Whistleblowers inside ' +
      'the agency have claimed to witness edited imagery before public release.',
    tags: ['NASA', 'cover-up', 'space', 'aliens'],
    createdBy: adminId,
  },
  {
    title: 'Global Government Shadow Council',
    description:
      'An unelected shadow council of bankers, industrialists, and politicians — sometimes called ' +
      'the Deep State — is believed to make all major geopolitical decisions above the level of ' +
      'elected governments, with elected leaders acting as figureheads.',
    tags: ['NWO', 'deep-state', 'elites', 'shadow-government'],
    createdBy: researcherId,
  },
];

const buildThreads = (nodes, adminId, researcherId) => {
  // Build a lookup by title for clean reference
  const n = Object.fromEntries(nodes.map(node => [node.title, node._id]));

  return [
    {
      fromNode:    n['Moon Landing Hoax'],
      toNode:      n['NASA Cover-up'],
      type:        'cause',
      description: 'The moon landing hoax narrative requires an active NASA cover-up operation to sustain the deception across decades.',
      createdBy:   adminId,
    },
    {
      fromNode:    n['Illuminati Control'],
      toNode:      n['Reptilian Elite'],
      type:        'influence',
      description: 'The Illuminati is theorised to be a human front organisation ultimately controlled by the reptilian elite bloodlines.',
      createdBy:   researcherId,
    },
    {
      fromNode:    n['5G Mind Control'],
      toNode:      n['Chemtrails'],
      type:        'similarity',
      description: 'Both 5G and chemtrails are framed as covert mass population control mechanisms deployed by the same network of actors.',
      createdBy:   adminId,
    },
    {
      fromNode:    n['Area 51 Secrets'],
      toNode:      n['NASA Cover-up'],
      type:        'cause',
      description: 'Reverse-engineered alien technology from Area 51 is claimed to feed into NASA programmes, necessitating joint secrecy.',
      createdBy:   researcherId,
    },
    {
      fromNode:    n['Time Travel Experiments'],
      toNode:      n['Global Government Shadow Council'],
      type:        'influence',
      description: 'The shadow council allegedly funds and directs classified time travel research under deep black-budget programmes.',
      createdBy:   adminId,
    },
    {
      fromNode:    n['Reptilian Elite'],
      toNode:      n['Global Government Shadow Council'],
      type:        'influence',
      description: 'The shadow council is theorised to be a reptilian-controlled body that coordinates all surface-level political events.',
      createdBy:   researcherId,
    },
    {
      fromNode:    n['Flat Earth Theory'],
      toNode:      n['NASA Cover-up'],
      type:        'cause',
      description: 'If the Earth is flat, NASA must necessarily be engaged in a massive, ongoing cover-up of its true geometry.',
      createdBy:   adminId,
    },
    {
      fromNode:    n['Illuminati Control'],
      toNode:      n['Global Government Shadow Council'],
      type:        'similarity',
      description: 'The Illuminati and the shadow council share overlapping membership and goals in conspiratorial narratives.',
      createdBy:   researcherId,
    },
    {
      fromNode:    n['Chemtrails'],
      toNode:      n['5G Mind Control'],
      type:        'influence',
      description: 'Chemtrails are alleged to deposit nano-receptors that make human brains more susceptible to 5G frequency control.',
      createdBy:   adminId,
    },
    {
      fromNode:    n['Area 51 Secrets'],
      toNode:      n['Time Travel Experiments'],
      type:        'cause',
      description: 'Alien propulsion tech recovered at Area 51 is claimed to have enabled the temporal displacement experiments at Montauk.',
      createdBy:   researcherId,
    },
  ];
};

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    err('MONGO_URI is not set in .env');
    process.exit(1);
  }

  console.log('\n🌱 RedThread — Database Seeder\n');
  console.log(`  Connecting to: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}\n`);

  await mongoose.connect(MONGO_URI);
  log('Connected to MongoDB');

  // ── Clear existing data ───────────────────────────────────────────────────
  console.log('\n  Clearing existing data…');
  const [uDel, nDel, tDel] = await Promise.all([
    User.deleteMany({}),
    ConspiracyNode.deleteMany({}),
    RedThread.deleteMany({}),
  ]);
  log(`Deleted ${uDel.deletedCount} user(s)`);
  log(`Deleted ${nDel.deletedCount} conspiracy node(s)`);
  log(`Deleted ${tDel.deletedCount} red thread(s)`);

  // ── If --clear flag passed, stop here ────────────────────────────────────
  if (process.argv.includes('--clear')) {
    console.log('\n  --clear flag detected. Skipping seed.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Create users ──────────────────────────────────────────────────────────
  console.log('\n  Creating users…');
  const createdUsers = await User.create(USERS);
  createdUsers.forEach(u => log(`User created: ${u.username} <${u.email}>`));

  const adminId      = createdUsers[0]._id;
  const researcherId = createdUsers[1]._id;

  // ── Create conspiracy nodes ───────────────────────────────────────────────
  console.log('\n  Creating conspiracy nodes…');
  const nodeData    = buildNodes(adminId, researcherId);
  const createdNodes = await ConspiracyNode.create(nodeData);
  createdNodes.forEach(n => log(`Node created: "${n.title}"`));

  // ── Validate no self-connections in thread data ───────────────────────────
  const threadData = buildThreads(createdNodes, adminId, researcherId);

  const selfLoops = threadData.filter(
    t => t.fromNode.toString() === t.toNode.toString()
  );
  if (selfLoops.length > 0) {
    warn(`Skipping ${selfLoops.length} self-referencing thread(s)`);
  }
  const validThreads = threadData.filter(
    t => t.fromNode.toString() !== t.toNode.toString()
  );

  // ── Create red threads ────────────────────────────────────────────────────
  console.log('\n  Creating red threads…');
  const createdThreads = await RedThread.create(validThreads);
  createdThreads.forEach(t => log(`Thread created: [${t.type}] ${t._id}`));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────');
  console.log(`  👤 Users:           ${createdUsers.length}`);
  console.log(`  🔴 Nodes:           ${createdNodes.length}`);
  console.log(`  🧵 Threads:         ${createdThreads.length}`);
  console.log('─────────────────────────────────────');
  console.log('\n  ✅ Seeding completed\n');

  await mongoose.disconnect();
  process.exit(0);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

seed().catch((e) => {
  err(`Seeding failed: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
