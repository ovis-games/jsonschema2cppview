#pragma once

#include <memory>
#include "nlohmann/json.hpp"

namespace jsonschema2cppview {

template <typename T>
class Array {
public:
  Array(const nlohmann::json& value) : value(value) {
    assert(value.is_array());
  }

private:
  const nlohmann::json& value;
};

} // namespace jsonschema2cppview
