add_json_schemas(
  TARGET refs-test
  JSON_LIBRARY nlohmann_json
  SCHEMA_FILES
    simple.schema.json
    with_ref.schema.json
)
