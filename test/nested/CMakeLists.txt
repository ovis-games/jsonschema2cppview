add_json_schemas(
  TARGET nested-test-lib
  JSON_LIBRARY nlohmann_json
  SCHEMA_FILES
    nested.schema.json
)
add_executable(
  nested-test
  nested.cpp
)
target_link_libraries(
  nested-test
  PUBLIC nested-test-lib
)
