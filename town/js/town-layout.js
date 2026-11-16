// Pebblewick — town layout data. Every placeholder in the scene comes from this file, so designers can
// move things around here without touching the engine code in town.js.
//
// Units are metres. x = east, z = south (north is -z). y = up, ground is y = 0.
// Buildings: `w` is the width of the front (door) side, `d` the depth, `h` the wall height.
//            `facing` is the side the front door is on: 'N' | 'S' | 'E' | 'W'.
// Props:     `rot` is a rotation in radians around y (0 = front faces south / +z).

export const TOWN = {
  name: 'Pebblewick',
  bounds: { minX: -62, maxX: 62, minZ: -56, maxZ: 58 }, // walkable area; hills rise beyond it
};

export const CATEGORIES = {
  home:        { label: 'Player home',  wall: '#f6e3bd', roof: '#e07a3a', accent: '#ffb347' },
  residential: { label: 'Residential',  wall: '#e6d3b6', roof: '#b45f48', accent: '#e8977a' },
  commercial:  { label: 'Shop',         wall: '#a8c6e6', roof: '#4d6c9c', accent: '#7fb2ff' },
  civic:       { label: 'Civic',        wall: '#cdbbe6', roof: '#67539a', accent: '#b79cff' },
  work:        { label: 'Work / farm',  wall: '#cfc5b0', roof: '#6d6155', accent: '#d6bf8f' },
  prop:        { label: 'Prop',         accent: '#d9d6cd' },
};

// ─────────────────────────────────────────────── roads (rect = [minX, minZ, maxX, maxZ]; earlier entries win overlaps)
export const ROADS = [
  { id: 'RD_TownSquare',   rect: [-13, -13, 13, 13],       surface: 'cobble' },
  { id: 'RD_MainStreet',   rect: [-3, -26, 3, 50.5],       surface: 'cobble' },
  { id: 'RD_MillLane',     rect: [-60, -3, 60, 3],         surface: 'cobble' },
  { id: 'RD_HallPlaza',    rect: [-10, -26, 10, -19],      surface: 'cobble' },
  { id: 'RD_StationPlaza', rect: [-10, 46, 10, 50.5],      surface: 'cobble' },
  { id: 'RD_WillowLane',   rect: [-56, 23, -3, 28],        surface: 'dirt' },
  { id: 'RD_FarmTrack',    rect: [-34.5, -26, -31.5, -3],  surface: 'dirt' },
  { id: 'RD_ParkPath',     rect: [3, 36.3, 21.2, 37.7],    surface: 'dirt' },
  { id: 'RD_HomePath',     rect: [-14.7, 21.6, -13.3, 23], surface: 'stone' },
];
export const RINGS = [
  { id: 'RD_PondLoop', x: 32, z: 37, r0: 9.6, r1: 11, surface: 'dirt' },
];

export const POND = { id: 'PROP_Pond', x: 32, z: 37, r: 7.5 };

// ─────────────────────────────────────────────── placeholder buildings (shells only, no interiors)
export const BUILDINGS = [
  { id: 'BLD_TownHall',     name: 'Town Hall',          cat: 'civic',       x: 0,   z: -31,  w: 16, d: 10, h: 7,   facing: 'S', roof: 'hip', tower: true },
  { id: 'BLD_Inn',          name: 'Inn',                cat: 'commercial',  x: -23, z: -10,  w: 14, d: 10, h: 6.6, facing: 'S', chimney: true },
  { id: 'BLD_Clinic',       name: 'Clinic',             cat: 'civic',       x: -41, z: -10,  w: 10, d: 9,  h: 4.2, facing: 'S' },
  { id: 'BLD_GeneralStore', name: 'General Store',      cat: 'commercial',  x: 21,  z: -10,  w: 12, d: 9,  h: 4.6, facing: 'S', awning: '#e86b5a' },
  { id: 'BLD_Blacksmith',   name: 'Blacksmith',         cat: 'work',        x: 39,  z: -10,  w: 10, d: 9,  h: 4.2, facing: 'S', chimney: true },
  { id: 'BLD_PostOffice',   name: 'Post Office',        cat: 'civic',       x: -21, z: 8.5,  w: 10, d: 7,  h: 4.2, facing: 'N' },
  { id: 'BLD_Bakery',       name: 'Bakery',             cat: 'commercial',  x: 20,  z: 9.5,  w: 10, d: 8,  h: 4.6, facing: 'N', chimney: true, awning: '#f2b84b' },
  { id: 'BLD_FlowerShop',   name: 'Flower Shop',        cat: 'commercial',  x: 35,  z: 9,    w: 8,  d: 7,  h: 4.2, facing: 'N', awning: '#ef8fb5' },
  { id: 'BLD_House02',      name: 'House 02',           cat: 'residential', x: -17, z: 34,   w: 10, d: 8,  h: 4.2, facing: 'N', chimney: true },
  { id: 'BLD_House03',      name: 'House 03',           cat: 'residential', x: -31, z: 34,   w: 10, d: 8,  h: 4.2, facing: 'N' },
  { id: 'BLD_House04',      name: 'House 04',           cat: 'residential', x: -45, z: 34,   w: 10, d: 8,  h: 4.2, facing: 'N', chimney: true },
  { id: 'BLD_House05',      name: 'House 05',           cat: 'residential', x: -34, z: 16,   w: 10, d: 8,  h: 4.2, facing: 'S', chimney: true },
  { id: 'BLD_House06',      name: 'House 06',           cat: 'residential', x: -48, z: 16,   w: 10, d: 8,  h: 4.2, facing: 'S' },
  { id: 'BLD_Barn',         name: 'Barn',               cat: 'work',        x: -17, z: -40,  w: 12, d: 9,  h: 5.5, facing: 'W' },
  { id: 'BLD_Station',      name: 'Train Station',      cat: 'civic',       x: 0,   z: 54,   w: 18, d: 7,  h: 4.6, facing: 'N' },
];

// ─────────────────────────────────────────────── the player's home (enterable)
// Coordinates inside HOME are local to (x, z). The front door faces south onto Willow Lane.
// Layout: your room (the LP_Officeroom2 model) at the back-left, a placeholder room at the back-right,
// and an entry hall across the front.
export const HOME = {
  id: 'BLD_PlayerHome', name: 'Your House', cat: 'home',
  x: -14, z: 17.5, halfW: 4.5, halfD: 4, wallH: 4.0, floorY: 0.11,
  // the room model: 5 × 5 m, modelled in cm with its two walls on its -x and -z sides
  room: { url: './assets/room/LP_Officeroom2.fbx', texture: './assets/room/Texture_1024.png', x: -2, z: -1.5, scale: 0.01 },
  spawn: { x: -2.6, z: -0.6, yaw: 0.75 }, // inside your room, on the rug, facing the door
  rooms: [
    { id: 'RM_PlayerRoom', name: 'Your Room',            rect: [-4.5, -4, 0.5, 1],   model: true },
    { id: 'RM_Placeholder',name: 'Room (placeholder)',   rect: [0.5, -4, 4.5, 1],    floor: ['#d9cfbf', '#cfc4b2'] },
    { id: 'RM_Hall',       name: 'Entry Hall',           rect: [-4.5, 1, 4.5, 4],    floor: ['#b8875c', '#b08055'] },
  ],
  // walls are axis-aligned lines a→b (wall centred on the line). openings: { at (coord along the wall), w, h, sill?, kind }
  walls: [
    { id: 'WALL_North',    a: [-4.5, -4.125], b: [4.5, -4.125], t: 0.25, ext: true, openings: [{ at: 2.5, w: 1.4, h: 1.2, sill: 1.1, kind: 'window' }] },
    { id: 'WALL_South',    a: [-4.5, 4.125],  b: [4.5, 4.125],  t: 0.25, ext: true, openings: [{ at: 0, w: 1.2, h: 2.3, kind: 'door' }, { at: -2.8, w: 1.5, h: 1.3, sill: 1.0, kind: 'window' }, { at: 2.8, w: 1.5, h: 1.3, sill: 1.0, kind: 'window' }] },
    { id: 'WALL_West',     a: [-4.625, -4],   b: [-4.625, 4],   t: 0.25, ext: true, openings: [{ at: 2.5, w: 1.2, h: 1.3, sill: 1.0, kind: 'window' }] },
    { id: 'WALL_East',     a: [4.625, -4],    b: [4.625, 4],    t: 0.25, ext: true, openings: [{ at: -1.6, w: 1.4, h: 1.3, sill: 1.0, kind: 'window' }, { at: 2.5, w: 1.2, h: 1.3, sill: 1.0, kind: 'window' }] },
    { id: 'WALL_HallNorth',a: [-4.5, 1.08],   b: [4.5, 1.08],   t: 0.16, openings: [{ at: -1.0, w: 1.1, h: 2.2, kind: 'door' }, { at: 2.6, w: 2.4, h: 2.6, kind: 'arch' }] },
    { id: 'WALL_RoomEast', a: [0.58, -4],     b: [0.58, 1.0],   t: 0.16, openings: [] },
  ],
  // doors open automatically when you walk up to them.
  // hinge: which end of the opening the hinge sits on (-1 = lower coordinate). swing: side it opens towards (+1 = +x / +z).
  doors: [
    { id: 'DOOR_Room',  name: 'Room door',  x: -1.0, z: 1.08,  axis: 'x', w: 1.1, h: 2.2, hinge: -1, swing: 1 },
    { id: 'DOOR_Front', name: 'Front door', x: 0,    z: 4.125, axis: 'x', w: 1.2, h: 2.3, hinge: -1, swing: -1 },
  ],
  // pieces of the room model you bump into (matched by mesh name)
  roomColliders: ['Office2_sofa', 'Office2_little_table', 'Office2_table', 'Office2_shelves'],
  roomCircleColliders: { Office2_chair: 0.42 },
};

// ─────────────────────────────────────────────── placeholder props
export const PROPS = [
  // town square
  { id: 'PROP_Fountain',    type: 'fountain', x: 0,    z: 0 },
  { id: 'PROP_NoticeBoard', type: 'board',    x: 8.5,  z: -10.6 },
  { id: 'PROP_StallFruit',  type: 'stall',    x: -9.4, z: -9.6,  color: '#e85d5d' },
  { id: 'PROP_StallFish',   type: 'stall',    x: -9.4, z: 9.6,   color: '#4fa3d9', rot: Math.PI },
  { id: 'PROP_StallCrafts', type: 'stall',    x: 9.4,  z: 9.6,   color: '#f2b84b', rot: Math.PI },
  { id: 'PROP_Bench01',     type: 'bench',    x: -11.3, z: -5.5, rot: Math.PI / 2 },
  { id: 'PROP_Bench02',     type: 'bench',    x: -11.3, z: 5.5,  rot: Math.PI / 2 },
  { id: 'PROP_Bench03',     type: 'bench',    x: 11.3,  z: -5.5, rot: -Math.PI / 2 },
  { id: 'PROP_Bench04',     type: 'bench',    x: 11.3,  z: 5.5,  rot: -Math.PI / 2 },
  { id: 'PROP_Planter01',   type: 'planter',  x: -6.6, z: -6.6 },
  { id: 'PROP_Planter02',   type: 'planter',  x: 6.6,  z: -6.6 },
  { id: 'PROP_Planter03',   type: 'planter',  x: -6.6, z: 6.6 },
  { id: 'PROP_Planter04',   type: 'planter',  x: 6.6,  z: 6.6 },
  // town hall
  { id: 'PROP_Flagpole01',  type: 'flagpole', x: -6.5, z: -22.5, color: '#b79cff' },
  { id: 'PROP_Flagpole02',  type: 'flagpole', x: 6.5,  z: -22.5, color: '#ffd166' },
  // your front yard
  { id: 'PROP_Mailbox',     type: 'mailbox',  x: -12.4, z: 22.2 },
  // shops + work
  { id: 'PROP_Crates01',    type: 'crates',   x: 26.4, z: -4.6 },
  { id: 'PROP_Barrels01',   type: 'barrels',  x: 15.6, z: -4.5 },
  { id: 'PROP_BreadCart',   type: 'cart',     x: 26.6, z: 4.7, rot: Math.PI / 2 },
  { id: 'PROP_FlowerPots',  type: 'pots',     x: 30.2, z: 4.6 },
  { id: 'PROP_Forge',       type: 'forge',    x: 46.8, z: -9.6 },
  { id: 'PROP_Anvil',       type: 'anvil',    x: 46.6, z: -6.4 },
  { id: 'PROP_Barrels02',   type: 'barrels',  x: -15.2, z: -4.3 },
  // farm
  { id: 'PROP_Field',       type: 'field',    x: -39, z: -35, w: 20, d: 18 },
  { id: 'PROP_Scarecrow',   type: 'scarecrow',x: -39, z: -35 },
  { id: 'PROP_Windmill',    type: 'windmill', x: -54, z: -18 },
  { id: 'PROP_HayBales',    type: 'hay',      x: -25.4, z: -42.6 },
  { id: 'PROP_Beehives',    type: 'hives',    x: 47, z: -30 },
  // park
  { id: 'PROP_Dock',        type: 'dock',     x: 32, z: 30, w: 2.4, d: 6 },
  { id: 'PROP_Gazebo',      type: 'gazebo',   x: 48, z: 27 },
  { id: 'PROP_Playground',  type: 'playground', x: 13, z: 27 },
  { id: 'PROP_Bench05',     type: 'bench',    x: 32, z: 49.6, rot: Math.PI },
  { id: 'PROP_Bench06',     type: 'bench',    x: 44.6, z: 37, rot: -Math.PI / 2 },
  { id: 'PROP_Bench07',     type: 'bench',    x: 19.6, z: 30.5, rot: Math.PI / 2 },
  // station + edges of town
  { id: 'PROP_Timetable',   type: 'board',    x: 6.5, z: 47.2 },
  { id: 'PROP_Rails',       type: 'rails',    x: 0, z: 60.5 },
  { id: 'PROP_SignEast',    type: 'signpost', x: 58, z: -4.4 },
];

export const LAMPS = [
  [-12.2, -12.2], [12.2, -12.2], [-12.2, 12.2], [12.2, 12.2],
  [-4, -19.5], [4, -19.5], [-3.8, 20], [3.8, 30], [-3.8, 43], [3.8, 43],
  [-30, 3.8], [28, 3.8], [-48, -3.8], [50, -3.8], [-24.6, 28.4], [-38, 29.4], [-24, 21.6], [-52, 21.6],
];

// fence lines [x1, z1, x2, z2] (axis-aligned)
export const FENCES = [
  // field (gap on the south side for the farm track)
  [-49.5, -44.5, -28.5, -44.5], [-49.5, -25.5, -35, -25.5], [-31, -25.5, -28.5, -25.5],
  [-49.5, -44.5, -49.5, -25.5], [-28.5, -44.5, -28.5, -25.5],
  // your front yard (gap for the path)
  [-19.6, 22.5, -14.9, 22.5], [-13.1, 22.5, -8.4, 22.5], [-19.6, 13.0, -19.6, 22.5], [-8.4, 13.0, -8.4, 22.5],
];
