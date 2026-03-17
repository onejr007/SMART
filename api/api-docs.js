/**
 * @file api/api-docs.js
 * @description API Documentation untuk AI Agent
 */

export const apiDocumentation = {
  version: '2.1.0',
  title: 'AI Web Framework API',
  description: 'RESTful API untuk AI-driven web component generation',
  
  endpoints: {
    health: {
      method: 'GET',
      path: '/api/health',
      description: 'System health check dengan detailed metrics',
      response: {
        status: 'string (healthy|degraded)',
        timestamp: 'number',
        uptime: 'number (seconds)',
        memory: 'object',
        metrics: 'object',
        healthChecks: 'object',
        version: 'string'
      },
      example: {
        status: 'healthy',
        timestamp: 1710691200000,
        uptime: 3600,
        memory: {
          heapUsed: '45.23 MB',
          heapTotal: '60.00 MB'
        },
        metrics: {
          requests: 150,
          successRate: '98.67%',
          cacheHitRate: '75.50%',
          errors: 2
        }
      }
    },
    
    structure: {
      method: 'GET',
      path: '/api/structure',
      description: 'Get project structure dengan AI analytics (cached 30s)',
      headers: {
        'X-Cache': 'HIT|MISS'
      },
      response: {
        components: 'array',
        pages: 'array',
        ai: 'object',
        timestamp: 'number'
      }
    },
    
    generateComponent: {
      method: 'POST',
      path: '/api/generate/component',
      description: 'Generate atau update single component',
      rateLimit: '100 requests/minute',
      body: {
        name: 'string (PascalCase, required)',
        type: 'string (ui|data|layout|form|navigation|media|utility, required)',
        content: 'string (optional, max 50000 chars)',
        aiMetadata: {
          prompt: 'string (recommended)',
          complexity: 'string (simple|medium|complex)',
          category: 'string',
          tags: 'array'
        }
      },
      response: {
        success: 'boolean',
        path: 'string',
        isUpdate: 'boolean',
        metrics: 'object'
      },
      errors: {
        400: 'Validation failed',
        429: 'Too many requests',
        500: 'Internal server error'
      },
      example: {
        request: {
          name: 'HeroSection',
          type: 'ui',
          content: 'Modern hero section with CTA',
          aiMetadata: {
            prompt: 'Create responsive hero section',
            complexity: 'simple'
          }
        },
        response: {
          success: true,
          path: '/components/HeroSection.js',
          isUpdate: false,
          metrics: {
            duration: 45,
            type: 'componentGeneration'
          }
        }
      }
    },
    
    generatePage: {
      method: 'POST',
      path: '/api/generate/page',
      description: 'Generate single page',
      body: {
        name: 'string (PascalCase, required)',
        layout: 'string (default|sidebar|fullwidth|grid|dashboard, required)',
        components: 'array (component names)',
        meta: {
          title: 'string',
          description: 'string',
          keywords: 'array'
        },
        aiMetadata: {
          purpose: 'string',
          targetAudience: 'string',
          complexity: 'string',
          prompt: 'string'
        }
      },
      response: {
        success: 'boolean',
        path: 'string',
        metrics: 'object'
      }
    },
    
    batchGenerate: {
      method: 'POST',
      path: '/api/batch/generate',
      description: 'Batch generate multiple components/pages (max 50 operations)',
      body: {
        operations: [
          {
            type: 'component|page',
            data: 'object (same as single generate)'
          }
        ]
      },
      response: {
        results: 'array',
        summary: {
          total: 'number',
          success: 'number',
          failed: 'number'
        },
        metrics: 'object'
      },
      example: {
        request: {
          operations: [
            {
              type: 'component',
              data: {
                name: 'Button',
                type: 'ui',
                content: 'Reusable button'
              }
            },
            {
              type: 'page',
              data: {
                name: 'Home',
                layout: 'default',
                components: ['HeroSection', 'Button']
              }
            }
          ]
        },
        response: {
          results: [
            { success: true, name: 'Button', path: '/components/Button.js' },
            { success: true, name: 'Home', path: '/pages/Home.html' }
          ],
          summary: {
            total: 2,
            success: 2,
            failed: 0
          }
        }
      }
    },
    
    analytics: {
      method: 'GET',
      path: '/api/ai/analytics',
      description: 'Comprehensive analytics dan metrics',
      response: {
        components: 'object',
        pages: 'object',
        patterns: 'object',
        performance: 'object',
        errors: 'object',
        system: {
          requests: 'object',
          generation: 'object',
          cache: 'object',
          errors: 'object'
        }
      }
    },
    
    contracts: {
      method: 'GET',
      path: '/api/ai/contracts',
      description: 'Get validation schemas dan generation rules',
      response: {
        validation: {
          componentSchema: 'object',
          pageSchema: 'object'
        },
        generationRules: {
          naming: 'string',
          componentTypes: 'array',
          pageLayouts: 'array',
          recommendation: 'string'
        }
      }
    },
    
    versions: {
      method: 'GET',
      path: '/api/versions/:type/:name',
      description: 'Get version history untuk component/page',
      params: {
        type: 'component|page',
        name: 'string (component/page name)'
      },
      response: {
        versions: 'array'
      }
    },
    
    restore: {
      method: 'POST',
      path: '/api/versions/restore',
      description: 'Restore specific version',
      body: {
        type: 'component|page',
        name: 'string',
        hash: 'string (version hash)'
      },
      response: {
        success: 'boolean',
        message: 'string'
      }
    }
  },
  
  rateLimiting: {
    window: '60 seconds',
    maxRequests: 100,
    headers: {
      'X-RateLimit-Limit': 'Maximum requests allowed',
      'X-RateLimit-Remaining': 'Requests remaining',
      'X-RateLimit-Reset': 'Timestamp when limit resets'
    }
  },
  
  validation: {
    componentName: {
      pattern: '^[A-Z][a-zA-Z0-9]*$',
      maxLength: 50,
      description: 'Must be PascalCase'
    },
    content: {
      maxLength: 50000,
      description: 'Maximum content size'
    },
    batchSize: {
      max: 50,
      description: 'Maximum operations per batch'
    }
  },
  
  bestPractices: [
    'Use batch operations untuk multiple files',
    'Include aiMetadata.prompt untuk better context learning',
    'Monitor /api/ai/analytics untuk optimize patterns',
    'Use version control untuk safe experimentation',
    'Follow PascalCase naming convention',
    'Validate using /api/ai/contracts before generation'
  ],
  
  workflow: {
    recommended: [
      '1. Health Check: GET /api/health',
      '2. Get Context: GET /api/structure + GET /api/ai/contracts',
      '3. Generate: POST /api/batch/generate',
      '4. Monitor: GET /api/ai/analytics',
      '5. Iterate: Use version control if needed'
    ]
  }
};

export default apiDocumentation;
