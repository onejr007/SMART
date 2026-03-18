// 50. Security review checklist + threat model
export interface SecurityCheck {
  id: string;
  category: 'XSS' | 'RTDB' | 'UGC' | 'SupplyChain' | 'Auth' | 'Network';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pass' | 'fail' | 'pending';
  mitigation?: string;
}

export class SecurityChecklist {
  private checks: SecurityCheck[] = [
    {
      id: 'xss-1',
      category: 'XSS',
      description: 'Sanitize all user input with DOMPurify',
      severity: 'critical',
      status: 'pending',
      mitigation: 'Use DOMPurify.sanitize() on all user-generated content'
    },
    {
      id: 'xss-2',
      category: 'XSS',
      description: 'Validate and escape HTML in chat messages',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 'rtdb-1',
      category: 'RTDB',
      description: 'Implement deny-by-default Firebase rules',
      severity: 'critical',
      status: 'pending',
      mitigation: 'Set default rule to deny all access'
    },
    {
      id: 'rtdb-2',
      category: 'RTDB',
      description: 'Validate data schema in Firebase rules',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 'rtdb-3',
      category: 'RTDB',
      description: 'Limit query size and depth',
      severity: 'medium',
      status: 'pending'
    },
    {
      id: 'ugc-1',
      category: 'UGC',
      description: 'Sign all UGC assets with cryptographic signatures',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 'ugc-2',
      category: 'UGC',
      description: 'Implement asset size limits',
      severity: 'medium',
      status: 'pending'
    },
    {
      id: 'ugc-3',
      category: 'UGC',
      description: 'Sandbox UGC scripts with capability restrictions',
      severity: 'critical',
      status: 'pending'
    },
    {
      id: 'supply-1',
      category: 'SupplyChain',
      description: 'Verify npm package integrity',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 'supply-2',
      category: 'SupplyChain',
      description: 'Use self-hosted decoders (Draco, KTX2)',
      severity: 'medium',
      status: 'pending'
    },
    {
      id: 'auth-1',
      category: 'Auth',
      description: 'Implement session verification',
      severity: 'critical',
      status: 'pending'
    },
    {
      id: 'auth-2',
      category: 'Auth',
      description: 'Rate limit authentication attempts',
      severity: 'high',
      status: 'pending'
    },
    {
      id: 'network-1',
      category: 'Network',
      description: 'Validate all network messages server-side',
      severity: 'critical',
      status: 'pending'
    },
    {
      id: 'network-2',
      category: 'Network',
      description: 'Implement rate limiting for network operations',
      severity: 'high',
      status: 'pending'
    }
  ];

  getChecks(category?: SecurityCheck['category']): SecurityCheck[] {
    if (category) {
      return this.checks.filter(c => c.category === category);
    }
    return [...this.checks];
  }

  updateStatus(id: string, status: SecurityCheck['status']): void {
    const check = this.checks.find(c => c.id === id);
    if (check) {
      check.status = status;
    }
  }

  getCriticalIssues(): SecurityCheck[] {
    return this.checks.filter(c => c.severity === 'critical' && c.status !== 'pass');
  }

  getComplianceScore(): number {
    const passed = this.checks.filter(c => c.status === 'pass').length;
    return (passed / this.checks.length) * 100;
  }

  generateReport(): string {
    const report = ['Security Checklist Report', '='.repeat(50), ''];
    
    const byCategory = new Map<string, SecurityCheck[]>();
    this.checks.forEach(check => {
      if (!byCategory.has(check.category)) {
        byCategory.set(check.category, []);
      }
      byCategory.get(check.category)!.push(check);
    });

    for (const [category, checks] of byCategory) {
      report.push(`\n${category}:`);
      checks.forEach(check => {
        report.push(`  [${check.status.toUpperCase()}] ${check.description}`);
        if (check.mitigation && check.status !== 'pass') {
          report.push(`    → ${check.mitigation}`);
        }
      });
    }

    report.push(`\nCompliance Score: ${this.getComplianceScore().toFixed(1)}%`);
    
    return report.join('\n');
  }
}
