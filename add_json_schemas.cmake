set(jsonschema2cppview_source_dir ${CMAKE_CURRENT_LIST_DIR})
set(jsonschema2cppview_binary_dir ${CMAKE_CURRENT_BINARY_DIR})

message(STATUS ${jsonschema2cppview_source_dir})
message(STATUS ${jsonschema2cppview_binary_dir})

find_program(
  NODE_EXECUTABLE
  node
  REQUIRED
)
find_program(
  NPM_EXECUTABLE
  npm
  REQUIRED
)
# add_custom_command(
#   OUTPUT ${jsonschema2cppview_source_dir}/node_modules
#   OUTPUT ${jsonschema2cppview_source_dir}/node_modules/typescript/bin/tsc
#   COMMAND ${NPM_EXECUTABLE} install
#   WORKING_DIRECTORY ${jsonschema2cppview_source_dir}
#   MAIN_DEPENDENCY ${jsonschema2cppview_source_dir}/package.json
# )
add_custom_command(
  OUTPUT ${jsonschema2cppview_binary_dir}/index.js
  COMMAND ${jsonschema2cppview_source_dir}/node_modules/typescript/bin/tsc --outDir ${jsonschema2cppview_binary_dir}
  WORKING_DIRECTORY ${jsonschema2cppview_source_dir}
  MAIN_DEPENDENCY ${jsonschema2cppview_source_dir}/tsconfig.json
)

option(JSONSCHEMA2CPPVIEW_BUILD_TESTS "Build tests" OFF)

include(FetchContent)

function(add_json_schemas)
  message(STATUS ${jsonschema2cppview_source_dir})
  message(STATUS ${jsonschema2cppview_binary_dir})
  set(options)
  set(oneValueArgs TARGET JSON_LIBRARY)
  set(multiValueArgs SCHEMA_FILES)
  cmake_parse_arguments(ADD_JSON_SCHEMAS "${options}" "${oneValueArgs}" "${multiValueArgs}" ${ARGN})

  set(DEPENDENCIES)
  set(SOURCE_FILES)

  if (ADD_JSON_SCHEMAS_JSON_LIBRARY STREQUAL "nlohmann_json")
    if (NOT TARGET nlohmann_json)
      FetchContent_Declare(
        nlohmann_json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG v3.10.5
      )
      FetchContent_MakeAvailable(
        nlohmann_json
      )
    endif ()

    # find_package(nlohmann_json REQUIRED)
    list(APPEND DEPENDENCIES "nlohmann_json")
    list(
      APPEND SOURCE_FILES
      "${jsonschema2cppview_source_dir}/jsonschema2cppview_nlohmann.hpp"
      "${jsonschema2cppview_source_dir}/jsonschema2cppview_nlohmann.cpp"
    )
  else ()
    message(FATAL_ERROR "Invalid json library: ${ADD_JSON_SCHEMAS_JSON_LIBRARY}")
  endif ()

  foreach (schema ${ADD_JSON_SCHEMAS_SCHEMA_FILES})
    get_filename_component(base_name ${schema} NAME_WLE)

    add_custom_command(
      OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.hpp
      OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.cpp
      COMMAND ${NODE_EXECUTABLE} ${jsonschema2cppview_binary_dir}/index.js ${CMAKE_CURRENT_SOURCE_DIR}/${schema} ${CMAKE_CURRENT_BINARY_DIR}
      WORKING_DIRECTORY ${jsonschema2cppview_source_dir}
      DEPENDS
        ${CMAKE_CURRENT_SOURCE_DIR}/${schema}
        ${jsonschema2cppview_source_dir}/node_modules
        ${jsonschema2cppview_binary_dir}/index.js
    )
    list(APPEND SOURCE_FILES ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.hpp)
    list(APPEND SOURCE_FILES ${CMAKE_CURRENT_BINARY_DIR}/${base_name}.cpp)
  endforeach ()

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
      ${jsonschema2cppview_source_dir}
      ${CMAKE_CURRENT_BINARY_DIR}
  )

endfunction(add_json_schemas)
