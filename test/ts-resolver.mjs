import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import ts from 'typescript';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      let targetPath = null;
      if (specifier.startsWith('@/')) {
        targetPath = path.resolve(process.cwd(), specifier.slice(2));
      } else if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const parentDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd();
        targetPath = path.resolve(parentDir, specifier);
      }
      
      if (targetPath) {
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          return {
            url: pathToFileURL(targetPath).href,
            shortCircuit: true,
          };
        }
        if (fs.existsSync(targetPath + '.ts')) {
          return {
            url: pathToFileURL(targetPath + '.ts').href,
            shortCircuit: true,
          };
        }
        if (fs.existsSync(targetPath + '.tsx')) {
          return {
            url: pathToFileURL(targetPath + '.tsx').href,
            shortCircuit: true,
          };
        }
        if (fs.existsSync(targetPath + '.json')) {
          return {
            url: pathToFileURL(targetPath + '.json').href,
            shortCircuit: true,
          };
        }
        if (fs.existsSync(path.join(targetPath, 'index.ts'))) {
          return {
            url: pathToFileURL(path.join(targetPath, 'index.ts')).href,
            shortCircuit: true,
          };
        }
      }
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const filePath = fileURLToPath(url);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${content};`,
    };
  }
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const filePath = fileURLToPath(url);
    const raw = fs.readFileSync(filePath, 'utf8');
    const transpileFn = ts.transpileModule || ts.default?.transpileModule;
    const { outputText } = transpileFn(raw, {
      compilerOptions: {
        module: ts.ModuleKind?.ESNext ?? 99,
        target: ts.ScriptTarget?.ESNext ?? 99,
        jsx: ts.JsxEmit?.ReactJSX ?? 4,
      },
    });
    return {
      format: 'module',
      shortCircuit: true,
      source: outputText,
    };
  }
  return nextLoad(url, context);
}
