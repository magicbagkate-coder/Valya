import path from 'node:path';

// A file in one module imports another module only through its index file.
// Example: src/modules/order/x.ts can import '../user', not '../user/userRepo'.
const INDEX_NAMES = new Set(['', 'index', 'index.ts', 'index.tsx', 'index.js']);

const toPosix = (value) => value.split(path.sep).join('/');

function moduleOf(absolute, modulesDir) {
  const marker = `/${modulesDir}/`;
  const position = absolute.indexOf(marker);
  if (position === -1) return undefined;
  const [name, ...rest] = absolute.slice(position + marker.length).split('/');
  return { name, rest: rest.join('/') };
}

function resolveSource(source, filename, aliases) {
  if (source.startsWith('.')) return toPosix(path.resolve(path.dirname(filename), source));
  const alias = Object.keys(aliases).find((prefix) => source.startsWith(prefix));
  if (!alias) return undefined;
  return toPosix(path.resolve(aliases[alias], source.slice(alias.length)));
}

export const moduleBoundary = {
  rules: {
    'module-boundary': {
      meta: {
        type: 'suggestion',
        schema: [
          {
            type: 'object',
            properties: { modulesDir: { type: 'string' }, aliases: { type: 'object' } },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] ?? {};
        const modulesDir = options.modulesDir ?? 'src/modules';
        const aliases = options.aliases ?? {};
        const importer = moduleOf(toPosix(context.filename), modulesDir);
        if (!importer) return {};

        const checkSource = (node) => {
          if (!node.source) return;
          const absolute = resolveSource(node.source.value, context.filename, aliases);
          if (!absolute) return;
          const target = moduleOf(absolute, modulesDir);
          if (!target || target.name === importer.name) return;
          if (INDEX_NAMES.has(target.rest)) return;
          context.report({
            node: node.source,
            message: `Import module '${target.name}' through its index file. Allowed: '${node.source.value.split(target.name)[0]}${target.name}'. See docs/rules/module-boundaries.md`,
          });
        };

        return {
          ImportDeclaration: checkSource,
          ExportNamedDeclaration: checkSource,
          ExportAllDeclaration: checkSource,
          ImportExpression: (node) => {
            if (node.source.type === 'Literal') checkSource({ source: node.source });
          },
        };
      },
    },
  },
};
