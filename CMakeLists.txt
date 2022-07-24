cmake_minimum_required(VERSION 3.19)

project(
  json-schema-2-cpp
  VERSION 0.1.0
)

function(start_object_nlohmann object_name)
  message("class ${object_name} {\n public:\n  ${object_name}(const nlohmann::json& value) {}\n}")
endfunction(start_object_nlohmann)

function(parse_schema schema_filename)


file(READ ${CMAKE_CURRENT_LIST_DIR}/${schema_filename} schema)

string(JSON id GET ${schema} id)
string(JSON title GET ${schema} title)
string(JSON type GET ${schema} type)

if (type STREQUAL "object")
  start_object_nlohmann(${title})
endif ()

message(STATUS ${type})

endfunction(parse_schema)

function(add_json_schemas)
  set(options)
  set(oneValueArgs)
  set(multiValueArgs SCHEMA_FILES)
  cmake_parse_arguments(GENERATE_SCHEMA_ADAPTORS "${options}" "${oneValueArgs}" "${multiValueArgs}" ${ARGN})

  foreach (schema_file ${GENERATE_SCHEMA_ADAPTORS_SCHEMA_FILES})
    parse_schema(${schema_file})
  endforeach ()



endfunction(add_json_schemas)

add_subdirectory(test)
