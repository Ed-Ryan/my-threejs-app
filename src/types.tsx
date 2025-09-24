
// A component can be a primitive or a composite (a group with children)
export type PrimitiveType = 'cube' | 'sphere' | 'cylinder' | 'cone' | 'd20';

export interface Component {
  id: string;
  name: string;
  type: PrimitiveType | 'group';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  children: Component[];
}
