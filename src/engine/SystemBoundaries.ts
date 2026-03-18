// 49. System boundaries + diagram dataflow
export interface SystemBoundary {
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'external';
  responsibilities: string[];
  inputs: DataFlow[];
  outputs: DataFlow[];
}

export interface DataFlow {
  from: string;
  to: string;
  data: string;
  protocol: string;
}

export class SystemBoundaries {
  private boundaries: SystemBoundary[] = [
    {
      name: 'Frontend (React + Three.js)',
      type: 'frontend',
      responsibilities: [
        'User interface rendering',
        'Game engine execution',
        'Client-side validation',
        'Local state management'
      ],
      inputs: [
        { from: 'User', to: 'Frontend', data: 'User input', protocol: 'DOM Events' },
        { from: 'Firebase Auth', to: 'Frontend', data: 'Auth state', protocol: 'Firebase SDK' },
        { from: 'Firebase RTDB', to: 'Frontend', data: 'Game data', protocol: 'WebSocket' }
      ],
      outputs: [
        { from: 'Frontend', to: 'Firebase Auth', data: 'Auth requests', protocol: 'HTTPS' },
        { from: 'Frontend', to: 'Firebase RTDB', data: 'Data updates', protocol: 'WebSocket' }
      ]
    },
    {
      name: 'Firebase Authentication',
      type: 'backend',
      responsibilities: [
        'User authentication',
        'Session management',
        'Token generation'
      ],
      inputs: [
        { from: 'Frontend', to: 'Firebase Auth', data: 'Login/Signup', protocol: 'HTTPS' }
      ],
      outputs: [
        { from: 'Firebase Auth', to: 'Frontend', data: 'Auth tokens', protocol: 'HTTPS' }
      ]
    },
    {
      name: 'Firebase Realtime Database',
      type: 'database',
      responsibilities: [
        'Data persistence',
        'Real-time synchronization',
        'Access control',
        'Data validation'
      ],
      inputs: [
        { from: 'Frontend', to: 'Firebase RTDB', data: 'CRUD operations', protocol: 'WebSocket' }
      ],
      outputs: [
        { from: 'Firebase RTDB', to: 'Frontend', data: 'Data snapshots', protocol: 'WebSocket' }
      ]
    }
  ];

  getBoundaries(): SystemBoundary[] {
    return this.boundaries;
  }

  generateDataFlowDiagram(): string {
    let diagram = 'System Data Flow Diagram\n';
    diagram += '='.repeat(50) + '\n\n';

    for (const boundary of this.boundaries) {
      diagram += `${boundary.name} (${boundary.type})\n`;
      diagram += '-'.repeat(50) + '\n';
      diagram += 'Responsibilities:\n';
      boundary.responsibilities.forEach(r => {
        diagram += `  - ${r}\n`;
      });
      diagram += '\nInputs:\n';
      boundary.inputs.forEach(i => {
        diagram += `  ${i.from} --[${i.data}]--> ${i.to} (${i.protocol})\n`;
      });
      diagram += '\nOutputs:\n';
      boundary.outputs.forEach(o => {
        diagram += `  ${o.from} --[${o.data}]--> ${o.to} (${o.protocol})\n`;
      });
      diagram += '\n';
    }

    return diagram;
  }
}
