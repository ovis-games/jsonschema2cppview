cmake_minimum_required(VERSION 3.14)

project(
  jsonschema2cppview
  VERSION 0.1.0
)

find_program(
  TS_NODE_EXECUTABLE
  ts-node
  REQUIRED
)
find_program(
  NPM_EXECUTABLE
  npm
  REQUIRED
)
add_custom_command(
  OUTPUT node_modules
  COMMAND ${NPM_EXECUTABLE} install
  WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
  MAIN_DEPENDENCY package.json
)
add_custom_target(
  npm-install
  OUTPUT
    ${CMAKE_SOURCE_DIR}/node_modules
)

function(add_json_schemas)
  set(options)
  set(oneValueArgs TARGET JSON_LIBRARY)
  set(multiValueArgs SCHEMA_FILES)
  cmake_parse_arguments(ADD_JSON_SCHEMAS "${options}" "${oneValueArgs}" "${multiValueArgs}" ${ARGN})

  set(DEPENDENCIES)
  set(SOURCE_FILES)

  if (ADD_JSON_SCHEMAS_JSON_LIBRARY STREQUAL "nlohmann_json")
    include(FetchContent)
    FetchContent_Declare(
      nlohmann_json
      GIT_REPOSITORY https://github.com/nlohmann/json.git
      GIT_TAG v3.10.5
    )
    FetchContent_MakeAvailable(
      nlohmann_json
    )

    # find_package(nlohmann_json REQUIRED)
    list(APPEND DEPENDENCIES "nlohmann_json::nlohmann_json")
    list(
      APPEND SOURCE_FILES
      "${CMAKE_SOURCE_DIR}/jsonschema2cppview_nlohmann.hpp"
      "${CMAKE_SOURCE_DIR}/jsonschema2cppview_nlohmann.cpp"
    )
  else ()
    message(FATAL_ERROR "Invalid json library: ${ADD_JSON_SCHEMAS_JSON_LIBRARY}")
  endif ()

  foreach (schema ${ADD_JSON_SCHEMAS_SCHEMA_FILES})
    get_filename_component(base_name ${schema} NAME_WE)
    set(base_name "${base_name}.schema")

    add_custom_command(
      OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.hpp
      OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.cpp
      COMMAND ${TS_NODE_EXECUTABLE} ${CMAKE_SOURCE_DIR}/index.ts ${CMAKE_CURRENT_SOURCE_DIR}/${schema} ${CMAKE_CURRENT_BINARY_DIR}
      WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
      DEPENDS
      ${CMAKE_CURRENT_SOURCE_DIR}/${schema}
        ${CMAKE_SOURCE_DIR}/node_modules
        ${CMAKE_SOURCE_DIR}/index.ts
    )
    list(APPEND SOURCE_FILES ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.hpp)
    list(APPEND SOURCE_FILES ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.cpp)
  endforeach ()

  message(STATUS ${SOURCE_FILES})
  add_library(
    ${ADD_JSON_SCHEMAS_TARGET}
    ${SOURCE_FILES}
  )
  target_compile_features(${ADD_JSON_SCHEMAS_TARGET} PUBLIC cxx_std_17)
  target_link_libraries(
    ${ADD_JSON_SCHEMAS_TARGET}
    PUBLIC ${DEPENDENCIES}
  )
  target_include_directories(
    ${ADD_JSON_SCHEMAS_TARGET}
    PUBLIC
      ${CMAKE_SOURCE_DIR}
      ${CMAKE_CURRENT_BINARY_DIR}
  )

endfunction(add_json_schemas)

add_subdirectory(test)
