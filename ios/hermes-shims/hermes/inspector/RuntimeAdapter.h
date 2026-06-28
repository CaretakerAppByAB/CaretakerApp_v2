// Compatibility shim: hermes/inspector/RuntimeAdapter.h was removed in newer Hermes
#pragma once
#include <hermes/hermes.h>
namespace facebook {
namespace hermes {
namespace inspector {
class RuntimeAdapter {
 public:
  virtual ~RuntimeAdapter() = default;
  virtual ::facebook::hermes::HermesRuntime& getRuntime() = 0;
  virtual void tickleJs() {}
};
} // namespace inspector
} // namespace hermes
} // namespace facebook
