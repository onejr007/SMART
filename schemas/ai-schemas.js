import Ajv from 'ajv';

const NAME_PATTERN = '^[A-Z][a-zA-Z0-9]*$';

export const componentSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'AI Component Schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: NAME_PATTERN },
    type: {
      type: 'string',
      enum: ['ui', 'data', 'layout', 'form', 'navigation', 'media', 'utility']
    },
    content: { type: 'string' },
    props: { type: 'object' },
    events: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          payload: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] }
        },
        required: ['name']
      }
    },
    dependencies: { type: 'array', items: { type: 'string' } },
    aiMetadata: {
      type: 'object',
      additionalProperties: false,
      properties: {
        prompt: { type: 'string' },
        aiPrompt: { type: 'string' },
        complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  required: ['name', 'type']
};

export const pageSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'AI Page Schema',
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', pattern: NAME_PATTERN },
    layout: { type: 'string', enum: ['default', 'sidebar', 'fullwidth', 'grid', 'dashboard'] },
    components: { type: 'array', items: { type: 'string', pattern: NAME_PATTERN } },
    meta: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } }
      }
    },
    aiMetadata: {
      type: 'object',
      additionalProperties: false,
      properties: {
        purpose: { type: 'string' },
        targetAudience: { type: 'string' },
        complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] },
        prompt: { type: 'string' }
      }
    }
  },
  required: ['name', 'layout']
};

const ajv = new Ajv({
  allErrors: true,
  strict: false
});

const validateComponentWithAjv = ajv.compile(componentSchema);
const validatePageWithAjv = ajv.compile(pageSchema);

function formatErrors(errors = []) {
  return errors.map((error) => {
    const field = error.instancePath ? error.instancePath.slice(1) : 'root';
    return `${field}: ${error.message}`;
  });
}

export function validateComponent(data) {
  const valid = validateComponentWithAjv(data);
  return {
    valid,
    errors: valid ? [] : formatErrors(validateComponentWithAjv.errors)
  };
}

export function validatePage(data) {
  const valid = validatePageWithAjv(data);
  return {
    valid,
    errors: valid ? [] : formatErrors(validatePageWithAjv.errors)
  };
}
