# 🧩 3D Model Builder (React + Three.js)

This project is an interactive **3D model builder** built with **React, TypeScript, and Three.js**. It lets you:

- Add primitive shapes (cube, sphere, cone, cylinder, d20).
- Edit properties (position, rotation, scale, name).
- Reorder components in a model hierarchy.
- Import your own `.glb` models (planned).
- Export your scene to `.obj`, `.glb`, or `.stl` formats.
- Interactively explore the scene with orbit controls.

---

## 🚀 Features

- **Canvas Viewer**  
  Real-time 3D rendering powered by [@react-three/fiber](https://github.com/pmndrs/react-three-fiber).

- **Add Primitives**  
  Quickly drop in basic 3D shapes (cube, sphere, cone, cylinder, d20).

- **Model Tree**  
  See and reorder a tree-like structure of all components in your scene.

- **Property Editor**  
  Select an object to rename it or update its transform (position, rotation, scale).

- **Export**  
  Save your design in different formats:
  - `.obj`
  - `.glb`
  - `.stl` (CAD-like)

- **Orbit Controls**  
  Rotate and pan the scene with your mouse:
  - Left click → rotate
  - Right click → pan

---

## 📦 Tech Stack

- **React + TypeScript**
- **Three.js**
- **@react-three/fiber** (React renderer for Three.js)
- **@react-three/drei** (helper components like `OrbitControls`)
- **three-stdlib** (exporters for OBJ, GLTF, STL)

---

## 🛠️ Local Setup

You’ll need **Node.js** and **npm** installed.

### Clone from GitHub
```bash
git clone [REPO_URL]
cd [PROJECT_NAME]
npm install
npm run dev   # or npm start
```

### Or locally
```bash
npm create vite@latest [PROJECT_NAME] --template react-ts
cd [PROJECT_NAME]

# Install dependencies
npm install three @react-three/fiber
npm install three @react-three/drei
npm install three-stdlib
npm install --save-dev @types/three   # optional (for TypeScript intellisense)

# Run
npm run dev
```