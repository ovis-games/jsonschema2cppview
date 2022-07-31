import { readFile, writeFile } from 'fs/promises';
import { JSONSchema7 } from 'json-schema';
import path from 'path';

let inputDirectory: string|undefined;

abstract class CodeGenerator {
  dependencies = "";
  headerFileContent = "";
  sourceFileConctent = "";

  writeHeader(value: string) {
    this.headerFileContent = this.headerFileContent + value;
  }

  writeSource(value: string) {
    this.sourceFileConctent = this.sourceFileConctent + value;
  }

  addDependency(ref: string) {
    this.dependencies = this.dependencies + `#include "${path.parse(ref).name}.hpp"\n`;
  }

  abstract addHeaders(): void;
  abstract startClass(name: string): void;
  abstract defineProperty(name: string, type: string, optional: boolean): void;
  abstract endClass(name: string): void;

  addTypeDef(oldname: string, newname: string) {
    this.writeHeader(`using ${newname} = ${oldname};`);
  }
}

class NlohmannJSONCodeGenerator extends CodeGenerator {
  addHeaders(): void {
    this.writeHeader(`
#include <cassert>
#include <memory>
#include <nlohmann/json.hpp>
#include "jsonschema2cppview_nlohmann.hpp"
`);
  }

  startClass(name: string) {
    this.writeHeader(`
class ${name} {
  const nlohmann::json& value;
 public:
  ${name}(const nlohmann::json& value) : value(value) {}
`);
  }

  defineProperty(name: string, type: string, optional: boolean) {
    if (optional) {
      this.writeHeader(`
  std::optional<${type}> ${name}() const {
    if (value.contains("${name}")) {
      return ${type}(value.at("${name}"));
    } else {
      return std::nullopt;
    }
  }`);
    } else {
      this.writeHeader(`
  ${type} ${name}() const {
    assert(value.contains("${name}"));
    return value.at("${name}");
  }`);
    }
  }

  endClass(_: string) {
    this.writeHeader(`};`);
  }
}

async function getRefId(ref: string): Promise<string|undefined> {
  try {
    return JSON.parse(await readFile(path.join(inputDirectory || '.', ref), { encoding: 'utf8' } ))['title']
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function generateCodeForObject(generator: CodeGenerator, schema: JSONSchema7, nameBase?: string): Promise<string|undefined> {
  const name = schema.title || nameBase || 'Temp';

  generator.startClass(name);

  if (schema.properties) {
    for (const property of Object.keys(schema.properties)) {
      const propertyDefinition = schema.properties[property];
      if (typeof propertyDefinition === 'object') {
        const propertyType = await generateCodeForSchema(generator, propertyDefinition, `${property}Type`);
        if (propertyType) {
          const isRequired = typeof schema.required === 'object' ? schema.required.indexOf(property) !== -1 : false;
          generator.defineProperty(property, propertyType, !isRequired);
        }
      }
    }
  }

  generator.endClass(name);

  return name;
}

async function generateCodeForArray(generator: CodeGenerator, schema: JSONSchema7, nameBase?: string): Promise<string|undefined> {
  if (!schema.items || Array.isArray(schema.items) || typeof schema.items === 'boolean') {
    return "";
  }
  const itemType = await generateCodeForSchema(generator, schema.items, `${nameBase}Item`);

  return `jsonschema2cppview::Array<${itemType}>` || "";
}

async function generateCodeForSchema(generator: CodeGenerator, schema: JSONSchema7, nameSuggestion: string): Promise<string|undefined> {
  const typename = schema.title || nameSuggestion;
  switch (schema.type) {
    case 'number':
      generator.addTypeDef('double', typename);
      return typename;

    case 'boolean':
      generator.addTypeDef('bool', typename);
      return typename;

    case 'object':
      return await generateCodeForObject(generator, schema, nameSuggestion);

    case 'string':
      generator.addTypeDef('std::string', typename);
      return typename;

    case 'array':
      return await generateCodeForArray(generator, schema, nameSuggestion);

    case 'null': return 'unknown';

    case 'integer':
      generator.addTypeDef('std::intmax_t', typename);
      return typename;
  }

  if (schema.$ref) {
    const type = await getRefId(schema.$ref);
    generator.addDependency(schema.$ref);
    return type;
  }

  return undefined;
}

async function generateCodeForFile(generator: CodeGenerator, filename: string) {
  const document = JSON.parse(await readFile(filename, { encoding: 'utf8' }));
  await generateCodeForSchema(generator, document as JSONSchema7, filename);
}

async function main() {
  const inputFile = process.argv[2];
  const outputDirectory = process.argv[3];
  const parsedPath = path.parse(inputFile);
  inputDirectory = parsedPath.dir;

  const outputHeaderFilePath = path.join(outputDirectory, `${parsedPath.name}.hpp`);
  const outputSourceFilePath = path.join(outputDirectory, `${parsedPath.name}.cpp`);

  const generator = new NlohmannJSONCodeGenerator();

  generator.addHeaders();
  await generateCodeForFile(generator, inputFile);

  await writeFile(outputHeaderFilePath, `#pragma once

#include <optional>
#include <string>

${generator.dependencies}

${generator.headerFileContent}`);

  await writeFile(outputSourceFilePath, `#include "${parsedPath.name}.hpp"

${generator.sourceFileConctent}`);
}

main()
  .catch(error => console.log(error));
