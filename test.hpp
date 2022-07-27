
class Test {
  std::shared_ptr<nlohmann::json> value;
 public:
  Test(std::shared_ptr<nlohmann::json> value) : value(value) {}
  Test(std::string_view json_value) : value(std::make_shared<nlohman::json>(nlohmann::json::parse(json_value))) {}

  std::optional<std::string> name() const {
    if (value->contains("name")) {
      return value->at("name");
    } else {
      return std::nullopt;
    }
  }
  std::optional<std::string> definitionType() const {
    if (value->contains("definitionType")) {
      return value->at("definitionType");
    } else {
      return std::nullopt;
    }
  }
  std::optional<unknown> properties() const {
    if (value->contains("properties")) {
      return value->at("properties");
    } else {
      return std::nullopt;
    }
  }};