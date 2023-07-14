/**
 * @fileoverview check paths with fsd arch
 * @author Anton
 */
"use strict";

const path = require('path')

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem', // `problem`, `suggestion`, or `layout`
    docs: {
      description: "check paths with fsd arch",
      recommended: false,
      url: null, // URL to the documentation page for this rule
    },
    fixable: 'code', // Or `code` or `whitespace`
    schema: [
      {
        type: 'object',
        properties: {
          alias: {
            type: 'string'
          },
        }
      }
    ], // Add a schema if the rule has options
    messages: {
      errorRelativePaths: 'В рамках одного слайса все пути должны быть относительными',
    },
  },

  create(context) {

    const alias = context.options[0]?.alias || '';


    return {
      ImportDeclaration(node) {
        // app/entity/Article - example
        const value = node.source.value
        const importTo = alias ? value.replace(`${alias}/`, '') : value;

        // current file
        const fromFileName = context.getFilename()

        if(shouldBeRelative(fromFileName, importTo)) {
          context.report({
            node,
            message: 'В рамках одного слайса все пути должны быть относительными',
            fix: (fixer) => {
              const normalizedPath = getNormalizedCurrentFilePath(fromFilename) // /entities/Article/Article.tsx
                  .split('/')
                  .slice(0, -1)
                  .join('/');
              let relativePath = path.relative(normalizedPath, `/${importTo}`)
                  .split('\\')
                  .join('/');

              if(!relativePath.startsWith('.')) {
                relativePath = './' + relativePath;
              }

              return fixer.replaceText(node.source, `'${relativePath}'`)
            }
          });
        }

      }
    };
  },
};

function isPathRelative(path) {
  return path === '.' || 
  path.startsWith('./') || 
  path.startsWith('../')
}

const layers = {
  'entity': 'entity',
  'features': 'features',
  'pages': 'pages',
  'shared': 'shared',
  'widgets': 'widgets',
}

function getNormalizedCurrentFilePath(currentFilePath) {
  const normalizedPath = path.toNamespacedPath(currentFilePath);
  const projectFrom = normalizedPath.split('src')[1];
  return projectFrom.split('\\').join('/')
}

function shouldBeRelative(from, to) {

  if(isPathRelative(to)) return false

  const toArray = to.split('/')
  const toLayer = toArray[0]
  const toSlice = toArray[1]

  if(!toLayer || !toSlice || !layers[toLayer]) {
    return false
  }

  const projectFrom = getNormalizedCurrentFilePath(from);
  const fromaArray = projectFrom.split('/')

  const fromLayer = fromaArray[1]
  const fromSlice = fromaArray[2]

  if(!fromLayer || !fromSlice || !layers[fromLayer]) {
    return false
  }

  return fromSlice === toSlice && toLayer === fromLayer
}
