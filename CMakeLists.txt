cmake_minimum_required(VERSION 3.14)

project(
  jsonschema2cppview
  VERSION 0.1.0
  )

include(add_json_schemas.cmake)

if (JSONSCHEMA2CPPVIEW_BUILD_TESTS)
  add_subdirectory(test)
endif ()
