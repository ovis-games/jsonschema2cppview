#include "nested.schema.hpp"

int main() {
  const auto nested_example = R"(
    {
      "nested": {
        "nested_property": "value"
      }
    }
  )"_json;
  const Nested nested(nested_example);
  assert(nested.nested().nested_property().has_value());
  assert(nested.nested().nested_property() == "value");
}
