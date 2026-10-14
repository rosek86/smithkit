# Migration guide

This document collects upgrade notes for existing Smithkit integrations. For a
new integration, start with the [README](../README.md) and the
[API documentation](https://rosek86.github.io/smithkit/api/).
When skipping versions, apply the relevant migrations in version order.

## 0.6.x to the next minor (unreleased)

Visual styles are grouped by element and chart construction can mount directly
into a container. Follow the [next minor migration guide](migration-next.md).

## 0.4.x to 0.5.0

No migration is required. Object-based trace inputs and default Touchstone `.s1p`
parsing remain supported. Packed data, two-port reflection import, and line
simplification are optional additions. See the [0.5.0 release notes](releases/0.5.0.md).

## 0.3.x to 0.4.0

Version 0.4.0 introduces grouped constructor options and `setOptions()`, static
chart defaults, and explicit marker creation. Follow the
[0.4 migration guide](migration-0.4.md) for constructor, configuration, and marker
changes.

## 0.2.x to 0.3.0

Version 0.3.0 replaces `GridLayer.setMinorVisible()` with
`setDetail('basic' | 'standard' | 'detailed')`:

| Previous call                  | Replacement                   |
| ------------------------------ | ----------------------------- |
| `layer.setMinorVisible(false)` | `layer.setDetail('standard')` |
| `layer.setMinorVisible(true)`  | `layer.setDetail('detailed')` |

Use `layer.setDetail('basic')` to show only the principal circles.

## 0.1.x to 0.2.0

Version 0.2.0 groups calculation, parsing, formatting, and comparison functions
into classes. Follow the [0.2 migration guide](migration-0.2.md) for the changed
imports and their replacements.

## Compatibility policy

The [API review and compatibility policy](api-review.md) define the public
contract and the compatibility scope intended for 1.0. During 0.x development,
breaking changes are documented in minor releases.
