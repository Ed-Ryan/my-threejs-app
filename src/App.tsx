// ----------------------
// Edward Ryan - 24/09/2025
// ----------------------



// ----------------------
// 0. Importing
// ----------------------

import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import { GLTFExporter } from 'three-stdlib';
import { OBJExporter } from 'three-stdlib';
import { STLExporter } from 'three-stdlib'; // treating CAD as STL


// ----------------------
// 1. DATA MODEL
// ----------------------

// A component can be a primitive or a composite (a group with children)
type PrimitiveType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'd20';

interface Component {
	id: string;
	name: string;
	type: PrimitiveType | 'group';
	position: [number, number, number];
	rotation: [number, number, number];
	scale: [number, number, number];
	children: Component[];
}

// ----------------------
// 2. 3D SCENE COMPONENTS
// ----------------------

// Renders a single primitive shape based on its type
interface PrimitiveProps {
	component: Component;
	selected: boolean;
	onClick: (id: string) => void;
}

const Primitive: React.FC<PrimitiveProps> = ({ component, selected, onClick }) => {
	const meshRef = useRef<THREE.Mesh>(null!);

	const color = selected ? 'gold' : 'cornflowerblue'; // to tell the difference between selected and unselected
	const material = new THREE.MeshStandardMaterial({ color });

	let shape;
	switch (component.type) {
		case 'cube':
			shape = <boxGeometry args={[1, 1, 1]} />;
			break;
		case 'sphere':
			shape = <sphereGeometry args={[1, 32, 32]} />;
			break;
		case 'cylinder':
			shape = <cylinderGeometry args={[1, 1, 2, 32]} />;
			break;
		case 'cone':
			shape = <coneGeometry args={[1, 2, 32]} />;
			break;
		case 'd20': // or Icosahedron
			shape = <icosahedronGeometry args={[1, 0]} />;
			break;
		default: // safety
			shape = <boxGeometry args={[1, 1, 1]} />;
			break;
	}

	return (
		<mesh
			ref={meshRef}
			position={component.position}
			rotation={component.rotation}
			scale={component.scale}
			material={material}
			castShadow
			receiveShadow
			// Attach the click handler to this mesh
			onClick={(e) => {
				e.stopPropagation(); // Prevents clicking through to other objects
				onClick(component.id);
			}}
		>
			{shape}
		</mesh>
	);
};

// Recursively renders the entire component tree
interface SceneProps {
	components: Component[];
	selectedComponentId: string | null;
	onComponentClick: (id: string) => void;
}

const Scene: React.FC<SceneProps> = ({ components, selectedComponentId, onComponentClick }) => {
	return (
		<group>
			{components.map((comp) => (
				<React.Fragment key={comp.id}>
					{comp.type !== 'group' && (
						<Primitive
							component={comp}
							selected={comp.id === selectedComponentId}
							onClick={onComponentClick}
						/>
					)}
					{comp.children.length > 0 && (
						<Scene
							components={comp.children}
							selectedComponentId={selectedComponentId}
							onComponentClick={onComponentClick}
						/>
					)}
				</React.Fragment>
			))}
		</group>
	);
};

interface ModelTreeProps {
	components: Component[];
	selectedId: string | null;
	onSelect: (id: string) => void;
	onReorder: (parentId: string | null, fromIndex: number, toIndex: number) => void;
}


const ModelTree: React.FC<ModelTreeProps> = ({ components, selectedId, onSelect, onReorder }) => {
	return (
		<ul>
			{components.map((comp, index) => (
				<li key={comp.id}>
					<span
						style={{
							cursor: "pointer",
							fontWeight: comp.id === selectedId ? "bold" : "normal",
							color: comp.id === selectedId ? "gold" : "white",
							marginRight: "8px",
						}}
						onClick={() => onSelect(comp.id)}
					>
						{comp.name} ({comp.type})
					</span>

					{/* Up/Down buttons */}
					<button
						disabled={index === 0}
						onClick={() => onReorder(null, index, index - 1)}
					>
						▲
					</button>
					<button
						disabled={index === components.length - 1}
						onClick={() => onReorder(null, index, index + 1)}
					>
						▼
					</button>

					{/* Render children */}
					{comp.children.length > 0 && (
						<ModelTree
							components={comp.children}
							selectedId={selectedId}
							onSelect={onSelect}
							onReorder={(parentId, from, to) =>
								onReorder(comp.id, from, to)
							}
						/>
					)}
				</li>
			))}
		</ul>
	);
};

// ----------------------
// 3. PROPERTY EDITOR COMPONENT
// ----------------------

interface PropertyEditorProps {
	selectedComponentId: string | null;
	model: Component[];
	onUpdate: (updatedComponent: Component) => void;
}

const findComponentById = (components: Component[], id: string): Component | null => {
	for (const comp of components) {
		if (comp.id === id) return comp;
		if (comp.children) {
			const found = findComponentById(comp.children, id);
			if (found) return found;
		}
	}
	return null;
};

const PropertyEditor: React.FC<PropertyEditorProps> = ({ selectedComponentId, model, onUpdate }) => {
	const [component, setComponent] = useState<Component | null>(null);

	React.useEffect(() => {
		if (selectedComponentId) {
			const selected = findComponentById(model, selectedComponentId);
			setComponent(selected);
		} else {
			setComponent(null);
		}
	}, [selectedComponentId, model]);

	if (!component) {
		return (
			<div className="property-editor-content">
				<p>No component selected.</p>
			</div>
		);
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const updatedComponent = { ...component };

		if (name.includes('.')) {
			const [prop, axis] = name.split('.');
			if (prop === 'position' || prop === 'rotation' || prop === 'scale') {
				const newArray: [number, number, number] = [...updatedComponent[prop]];
				const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
				newArray[axisIndex] = parseFloat(value);
				updatedComponent[prop] = newArray;
			}
		} else {
			(updatedComponent as any)[name] = value;
		}

		onUpdate(updatedComponent);
	};

	return (
		<div className="property-editor-content">
			<h4>{component.name} Properties</h4>

			<label>Name</label>
			<input
				type="text"
				name="name"
				value={component.name}
				onChange={handleInputChange}
			/><br></br>

			<label>Position</label>
			<div className="property-group">
				<input type="number" name="position.x" value={component.position[0]} onChange={handleInputChange} />
				<input type="number" name="position.y" value={component.position[1]} onChange={handleInputChange} />
				<input type="number" name="position.z" value={component.position[2]} onChange={handleInputChange} />
			</div>

			<label>Rotation</label>
			<div className="property-group">
				<input type="number" name="rotation.x" value={component.rotation[0]} onChange={handleInputChange} />
				<input type="number" name="rotation.y" value={component.rotation[1]} onChange={handleInputChange} />
				<input type="number" name="rotation.z" value={component.rotation[2]} onChange={handleInputChange} />
			</div>

			<label>Scale</label>
			<div className="property-group">
				<input type="number" name="scale.x" value={component.scale[0]} onChange={handleInputChange} />
				<input type="number" name="scale.y" value={component.scale[1]} onChange={handleInputChange} />
				<input type="number" name="scale.z" value={component.scale[2]} onChange={handleInputChange} />
			</div>
		</div>
	);
};


// ----------------------
// 4. MAIN APP & UI
// ----------------------

const App: React.FC = () => {
	const [model, setModel] = useState<Component[]>([]);
	const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

	const addPrimitive = (type: PrimitiveType) => {
		const newComponent: Component = {
			id: Math.random().toString(36).substring(2, 9),
			name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
			type,
			position: [0, 0, 0],
			rotation: [0, 0, 0],
			scale: [1, 1, 1],
			children: [],
		};
		setModel(prev => [...prev, newComponent]);
	};

	const updateComponent = (updatedComponent: Component) => {
		const updateRecursive = (components: Component[]): Component[] => {
			return components.map(comp => {
				if (comp.id === updatedComponent.id) {
					return { ...updatedComponent };
				}
				if (comp.children.length > 0) {
					return { ...comp, children: updateRecursive(comp.children) };
				}
				return comp;
			});
		};
		setModel(updateRecursive(model));
	};

	const reorder = (
		parentId: string | null,
		fromIndex: number,
		toIndex: number
	) => {
		const reorderList = (list: Component[]): Component[] => {
			const newList = [...list];
			const [moved] = newList.splice(fromIndex, 1);
			newList.splice(toIndex, 0, moved);
			return newList;
		};

		const updateRecursive = (components: Component[]): Component[] => {
			if (!parentId) {
				return reorderList(components);
			}
			return components.map(comp => {
				if (comp.id === parentId) {
					return { ...comp, children: reorderList(comp.children) };
				}
				if (comp.children.length > 0) {
					return { ...comp, children: updateRecursive(comp.children) };
				}
				return comp;
			});
		};

		setModel((prev: Component[]) => updateRecursive(prev));
	};

	const onExport = (format: 'obj' | 'glb' | 'cad') => {
		// Create a temporary scene
		const scene = new THREE.Scene();

		// Recursive function to build the scene from components
		const buildScene = (components: Component[], parent: THREE.Object3D) => {
			components.forEach(comp => {
				let mesh: THREE.Mesh | null = null;
				const material = new THREE.MeshStandardMaterial({ color: 'white' });

				switch (comp.type) {
					case 'cube':
						mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
						break;
					case 'sphere':
						mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
						break;
					case 'cylinder':
						mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 32), material);
						break;
					case 'cone':
						mesh = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);
						break;
					case 'd20':
						mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), material);
						break;
					case 'group':
					default:
						mesh = null;
						break;
				}

				if (mesh) {
					mesh.position.set(...comp.position);
					mesh.rotation.set(...comp.rotation);
					mesh.scale.set(...comp.scale);
					parent.add(mesh);
				}

				if (comp.children.length > 0) {
					const group = new THREE.Group();
					parent.add(group);
					buildScene(comp.children, group);
				}
			});
		};

		buildScene(model, scene);

		if (format === 'obj') {
			const exporter = new OBJExporter();
			const result = exporter.parse(scene);
			downloadFile(result, 'model.obj', 'text/plain');
		} else if (format === 'glb') {
			const exporter = new GLTFExporter();
			exporter.parse(
				scene,
				(result) => {
					const blob = result instanceof ArrayBuffer
						? new Blob([result], { type: 'application/octet-stream' })
						: new Blob([JSON.stringify(result)], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = url;
					link.download = 'model.glb';
					link.click();
					URL.revokeObjectURL(url);
				},
				{ binary: true } as any
			);
		} else if (format === 'cad') {
			const exporter = new STLExporter();
			const result = exporter.parse(scene);
			downloadFile(result, 'model.stl', 'application/sla'); // CAD-ish format
		}
	};

	// Help with Downloads
	const downloadFile = (data: any, filename: string, mimeType: string) => {
		const blob = new Blob([data], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	};

	// Actual webpage
	return (
		<div className="app-container">
			{/* Three.js Canvas */}
			<div className="canvas-container">
				<Canvas
					camera={{ position: [5, 5, 5], fov: 75 }}
					shadows
					// onClick={() => setSelectedComponentId(null)} 
					onPointerMissed={() => setSelectedComponentId(null)}
				>
					<ambientLight intensity={0.5} />
					<directionalLight position={[10, 10, 5]} intensity={1} castShadow />
					<OrbitControls />

					<Scene
						components={model}
						selectedComponentId={selectedComponentId}
						onComponentClick={setSelectedComponentId}
					/>
				</Canvas>
			</div>

			{/* UI Panels */}
			<div className="ui-panels">
				{/* Export Design */}
				<div className="panel export-panel">
					<h2>Export Design 💾</h2>
					<button onClick={() => onExport('obj')}>Download .obj</button>
					<button onClick={() => onExport('glb')}>Download .glb</button>
					<button onClick={() => onExport('cad')}>Download CAD</button>
				</div>

				{/* Panel for adding components */}
				<div className="panel add-primitives-panel">
					<h3>Add 3D model(s) to Design 🧩 </h3>
					<button onClick={() => addPrimitive('cube')}>Cube</button>
					<button onClick={() => addPrimitive('sphere')}>Sphere</button>
					<button onClick={() => addPrimitive('cylinder')}>Cylinder</button>
					<button onClick={() => addPrimitive('cone')}>Cone</button>
					<button onClick={() => addPrimitive('d20')}>D20</button>
				</div>

				{/*  Model Tree Hierarchy */}
				<div className="panel model-tree-panel">
					<h2>Model Tree Hierarchy 🧬 </h2>
					<ModelTree
						components={model}
						selectedId={selectedComponentId}
						onSelect={setSelectedComponentId}
						onReorder={reorder}
					/>
				</div>

				{/* Components Property Editor */}
				<div className="panel property-editor-panel">
					<h2>Property Editor ✏️ </h2>
					<PropertyEditor
						selectedComponentId={selectedComponentId}
						model={model}
						onUpdate={updateComponent}
					/>
				</div>

				{/* How to use this tool */}
				<div className="panel how-to-panel">
					<h2>How to use this tool 💡</h2>
					<p>
						<strong>1. Add Components:</strong> Use the "Add 3D model(s) to Design" panel to place a 3D object on the canvas. The newly added model will be placed at the origin of the canvas.
					</p>
					<p>
						<strong>2. Adding your own Component:</strong> In addition to providing you with a few basis components, we offer you the ability to enter your own <code>.glb</code> file into the webpage. Once added the new component will be named after the filename and available for your selection going further.
					</p>
					<p>
						<strong>3. Select & Edit:</strong> To edit a component you have already added to the panel, you can click on the component within the canvas or simply click on the components name found within the Model Tree Hierarchy panel.<br></br><em>A helpful tip is to use the "Property Editor" panel to rename the component within the model tree's hierarchy to keep track of the components.</em>
					</p>
					<p>
						<strong>4. Observing the Model:</strong> Within the canvas you can rotate the model by dragging the model with a left click, or you can move the canvas's origin through dragging the model while holding a right click.
					</p>
					<p>
						<strong>5. Reorder:</strong> To reorder the Model Tree's Hierarchy, you will need to click the 🔼 or 🔽 button next to the component you wish to rearrange.
					</p>
					<p>
						<strong>6. Exporting:</strong> As this is your creation, you can export your creation using the handy download button found in the "Export Design" panel located at the top of this panel section.
					</p>
				</div>

				{/* Running this tool Locally */}
				<div className="panel local-setup-panel">
					<h2>Running this tool Locally 💻</h2>
					<p>
						To set up your environment, you'll need <strong>Node.js</strong> and <strong>npm</strong>.
					</p>
					<h4>Setup Steps <code>From GITHUB</code>:</h4>
					<ol>
						<li>Clone the repository: <code>git clone [REPO_URL]</code></li>
						<li>Navigate to the project directory: <code>cd [PROJECT_NAME]</code></li>
						<li>Install dependencies: <code>npm install</code></li>
						<li>Start the development server: <code>npm run dev</code> or <code>npm start</code> (depending on your configuration)</li>
					</ol>
					<hr></hr>
					<h4>Setup Steps <code>Locally</code></h4>
					<ol>
						<li>Start by creating the Webpage: <code>npm create vite@latest [PROJECT_NAME] --template react-ts</code></li>
						<li>Navigate to newly created directory: <code>cd [PROJECT NAME]</code></li>
						<li>Install the dependencies:</li>
						<ol>
							<li><code>npm install three @react-three/fiber</code></li>
							<li><code>npm install three @react-three/drei</code></li>
							<li><strong>Optional:</strong> I was required to do the following <code>npm install --save-dev @types/three</code></li>
							<li><code>npm install three-stdlib</code></li>
						</ol>
						<li>Run the Webpage: <code>npm run dev</code></li>
					</ol>
				</div>
			</div>
		</div>
	);
};

export default App;
