// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: npm run sync:catalog
//
// Offline fallback for introspection. See scripts/sync-catalog.mjs for why this
// exists and for the release ordering that keeps it honest.
//
// Source : https://intel.threadlinqs.com/mcp/catalog.json
// Counts : 81 tools, 25 prompts, 14 resources, 3 resource templates

export interface CatalogSnapshot {
  tools: unknown[];
  prompts: unknown[];
  resources: unknown[];
  resourceTemplates: unknown[];
}

export const CATALOG_SNAPSHOT: CatalogSnapshot = {
  "tools": [
    {
      "name": "get_started",
      "title": "Get Started",
      "description": "Start here. Returns the Threadlinqs Intelligence tool catalog, categories, tiering, and usage guidance. No API call — read this before using other tools.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Get Started",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "server": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "tiering": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "instructions": {
            "type": "string"
          },
          "categories": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "tools": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "resources": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "exports": {
            "type": "string"
          }
        },
        "required": [
          "tools"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "search_vulnerabilities",
      "title": "Search Vulnerabilities",
      "description": "Query the real-time CVE feed — validated against CVE.org and enriched from open sources (CVSS, EPSS exploitation probability, CISA KEV, public PoCs/exploits, nuclei detection templates, affected products/packages, plus platform-native trending/priority). Sort by trending|latest|priority|cvss|epss; filter by severity, kev (KEV-only), has_poc, nuclei, epss_min, window (days), vendor, cwe, or free-text query. Returns COMPACT cards {cve_id, severity, cvss, epss_percentile, is_kev, has_poc/exploit/nuclei, priority, trending, vendors, age} — call get_cve(id) for full detail.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Free-text: a CVE id or keyword (matches id + description)"
          },
          "sort": {
            "type": "string",
            "description": "trending (default) | latest | priority | cvss | epss"
          },
          "severity": {
            "type": "string",
            "description": "CRITICAL | HIGH | MEDIUM | LOW"
          },
          "kev": {
            "type": "boolean",
            "description": "Only CISA KEV (known-exploited) CVEs"
          },
          "has_poc": {
            "type": "boolean",
            "description": "Only CVEs with a public proof-of-concept"
          },
          "nuclei": {
            "type": "boolean",
            "description": "Only CVEs with a nuclei detection template"
          },
          "epss_min": {
            "type": "number",
            "description": "Minimum EPSS exploitation probability, 0-1"
          },
          "window": {
            "type": "number",
            "description": "Only CVEs published within the last N days"
          },
          "vendor": {
            "type": "string",
            "description": "Affected vendor/product substring"
          },
          "cwe": {
            "type": "string",
            "description": "Weakness id, e.g. CWE-79"
          },
          "limit": {
            "type": "number",
            "description": "default 30, max 100"
          }
        }
      },
      "annotations": {
        "title": "Search Vulnerabilities",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "vulnerabilities": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "cve_id": {
                  "type": "string",
                  "description": "Pass to get_cve / get_cve_intelligence / bulk_get_cves."
                },
                "title": {
                  "type": "string"
                },
                "cvss": {
                  "type": "number"
                },
                "severity": {
                  "type": "string"
                },
                "epss": {
                  "type": "number"
                },
                "is_kev": {
                  "type": "boolean"
                },
                "has_poc": {
                  "type": "boolean"
                },
                "priority": {
                  "type": "number"
                },
                "threat_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "total": {
            "type": "integer"
          },
          "facets": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "sort": {
            "type": "string"
          },
          "pagination": {
            "type": "object",
            "properties": {
              "limit": {
                "type": "integer"
              },
              "offset": {
                "type": "integer"
              },
              "has_more": {
                "type": "boolean"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "vulnerabilities"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/vulns",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "search_threats",
      "title": "Search Threats",
      "description": "The deterministic threat-catalog query tool. Returns LEAN summary rows {id, title, severity, category, status, threat_actor, nation_state, affected_products, cves, cvss_score, summary, created} — call get_threat for full detail on a specific id. Combine a free-text `query` with any structured filters; ALL filters AND-combine and apply together (e.g. query=\"supply chain\" + threat_actor=\"TeamPCP\" + category=\"SUPPLY_CHAIN\" returns only matching rows, with affected_products inline). Paginated: limit (default 20, max 100) + offset/cursor; result carries total, has_more, and next_cursor.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Free-text term across title/summary/description/CVE/actor (optional; AND-combined with filters)"
          },
          "severity": {
            "type": "string",
            "description": "critical | high | medium | low"
          },
          "category": {
            "type": "string",
            "description": "e.g. SUPPLY_CHAIN, MALWARE, RANSOMWARE, VULNERABILITY, APT, PHISHING, ZERO_DAY (call list_threat_categories for the full vocabulary)"
          },
          "status": {
            "type": "string",
            "description": "Threat status filter (e.g. active)"
          },
          "threat_actor": {
            "type": "string",
            "description": "Filter by attributed actor name/alias (e.g. \"TeamPCP\", \"APT29\")"
          },
          "nation_state": {
            "type": "string",
            "description": "Filter by nation-state (e.g. Russia, China, Iran)"
          },
          "motivation": {
            "type": "string",
            "description": "Filter by motivation (e.g. financial, espionage)"
          },
          "target_sector": {
            "type": "string",
            "description": "Filter by targeted sector (e.g. Healthcare, Finance)"
          },
          "target_region": {
            "type": "string",
            "description": "Filter by targeted region (e.g. APAC, Europe)"
          },
          "affected_product": {
            "type": "string",
            "description": "Filter by affected product/vendor (e.g. \"npm\", \"Microsoft\", \"VS Code\")"
          },
          "tag": {
            "type": "string",
            "description": "Filter by exact tag (e.g. \"supply-chain-compromise\")"
          },
          "mitre_technique": {
            "type": "string",
            "description": "Filter by MITRE technique id (e.g. T1059)"
          },
          "cve": {
            "type": "string",
            "description": "Filter by CVE id (e.g. CVE-2026-45321)"
          },
          "malware": {
            "type": "string",
            "description": "Filter to threats deploying a malware family (e.g. \"LockBit\", \"Vidar\")"
          },
          "tool": {
            "type": "string",
            "description": "Filter to threats using a tool (e.g. \"Cobalt Strike\", \"Mimikatz\")"
          },
          "campaign": {
            "type": "string",
            "description": "Filter to threats in a named campaign/operation (e.g. \"Snowflake campaign\")"
          },
          "os": {
            "type": "string",
            "description": "Filter to threats affecting an operating system (e.g. \"Windows\", \"Linux\", \"VMware ESXi\")"
          },
          "sector": {
            "type": "string",
            "description": "Filter by grounded industry sector (e.g. \"Healthcare\", \"Government\")"
          },
          "created_after": {
            "type": "string",
            "description": "ISO date — only threats created on/after (e.g. 2026-05-01)"
          },
          "created_before": {
            "type": "string",
            "description": "ISO date — only threats created on/before"
          },
          "limit": {
            "type": "number",
            "description": "Max results (default 20, max 100)"
          },
          "offset": {
            "type": "number",
            "description": "Row offset for pagination (default 0)."
          },
          "cursor": {
            "type": "string",
            "description": "Opaque pagination cursor (next_cursor from a prior result); ignored when offset is given."
          }
        }
      },
      "annotations": {
        "title": "Search Threats",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Threat ID (TL-YYYY-NNNN) — pass to get_threat."
                },
                "title": {
                  "type": "string"
                },
                "severity": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "threat_actor": {
                  "type": "string"
                },
                "created_at": {
                  "type": "string"
                },
                "detection_count": {
                  "type": "integer"
                },
                "ioc_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/threats",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_threat",
      "title": "Get Threat",
      "description": "Get the detail for a single threat by its ID (e.g. TL-2026-0042): overview, attribution, MITRE techniques, IOCs, the detection roster, timeline, targets and tags. RETRIEVABLE IN PARTS — pass `sections` to choose what comes back; the response echoes `_sections` telling you what was returned and what was omitted. By default detection RULE BODIES (SPL/KQL/Sigma) are omitted — they are ~40% of a heavy dossier and have dedicated tools (export_detection / get_detection_detail) — and `description` is trimmed to 1500 chars with `description_chars` disclosing the true length. Pass sections=\"all\" and max_description=-1 for the complete record. For malware families, tools, sectors/regions, OS and campaigns, call get_threat_enrichment.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          },
          "sections": {
            "type": "string",
            "description": "CSV of sections to return. Any of: overview, attribution, mitre, iocs, detections (WITH rule bodies), detections_meta (roster only, the default), timeline, tags, targets, remediation, references (full bibliography), references_compact (ranked primary-first + corroboration summary, in the default), similar, updates, osint, flow, entities — or \"all\", or \"row\" (exclusive: a ~500-byte identity row plus section counts). Default: overview,attribution,mitre,iocs,detections_meta,timeline,tags,targets,similar,flow,osint,references_compact"
          },
          "max_description": {
            "type": "number",
            "description": "Char budget for the narrative description. Default 1500; 0 drops it; -1 returns it whole."
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "title": "Get Threat",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Threat ID (TL-YYYY-NNNN)."
          },
          "title": {
            "type": "string"
          },
          "summary": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "severity": {
            "type": "object",
            "properties": {
              "level": {
                "type": "string"
              },
              "cvss": {
                "type": "number"
              }
            },
            "additionalProperties": true
          },
          "status": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "identifiers": {
            "type": "object",
            "properties": {
              "cve": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "cwe": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "aliases": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            },
            "additionalProperties": true
          },
          "attribution": {
            "type": "object",
            "properties": {
              "threat_actor": {
                "type": "string"
              },
              "nation_state": {
                "type": "string"
              },
              "motivation": {
                "type": "string"
              },
              "confidence": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "mitre_attack": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "tactic": {
                  "type": "string"
                },
                "technique": {
                  "type": "string"
                },
                "technique_id": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "detections": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "detection_type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "iocs": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "references": {
            "type": "array",
            "items": {},
            "description": "Full bibliography. Present only under sections=references or sections=all."
          },
          "references_compact": {
            "type": "array",
            "description": "Ranked primary-first, capped at 8. Present in the DEFAULT projection and in both bundles.",
            "items": {
              "type": "object",
              "properties": {
                "url": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "tier": {
                  "type": "string",
                  "description": "primary | research | secondary"
                }
              },
              "additionalProperties": true
            }
          },
          "references_summary": {
            "type": "object",
            "properties": {
              "total": {
                "type": "integer"
              },
              "primary_count": {
                "type": "integer"
              },
              "independent_domains": {
                "type": "integer",
                "description": "Distinct registrable domains across ALL references — the corroboration count. Deliberately under-counted."
              },
              "earliest_source_date": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "latest_source_date": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "omitted": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "created_at": {
            "type": "string"
          },
          "updated_at": {
            "type": "string"
          },
          "osint": {
            "type": [
              "object",
              "null"
            ],
            "description": "Community-OSINT summary; null below Red tier or when unscanned."
          },
          "description_chars": {
            "type": "integer",
            "description": "True length of description when it was trimmed to max_description."
          },
          "description_truncated": {
            "type": "boolean"
          },
          "_sections": {
            "type": "object",
            "properties": {
              "returned": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "Sections present in THIS response."
                }
              },
              "omitted": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "Sections deliberately left out — re-call with sections=<name> to fetch them."
                }
              },
              "available": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "ignored_unknown": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/threat",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_recent_threats",
      "title": "Recent Threats",
      "description": "List the most recently published threats. Paginated: pass limit (default 15, max 100) and offset to page through older threats; the result includes has_more and an opaque next_cursor (reusable as offset/cursor).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "description": "Max results (default 15, max 100)"
          },
          "offset": {
            "type": "number",
            "description": "Row offset for pagination (default 0). Or pass cursor from a prior result."
          },
          "cursor": {
            "type": "string",
            "description": "Opaque pagination cursor (next_cursor from a prior result). Decoded to an offset; ignored when offset is given."
          }
        }
      },
      "annotations": {
        "title": "Recent Threats",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Threat ID (TL-YYYY-NNNN) — pass to get_threat."
                },
                "title": {
                  "type": "string"
                },
                "severity": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "threat_actor": {
                  "type": "string"
                },
                "created_at": {
                  "type": "string"
                },
                "detection_count": {
                  "type": "integer"
                },
                "ioc_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/threats",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_detections",
      "title": "Get Detections",
      "description": "List detection logic (Splunk SPL, Microsoft KQL, Sigma). Optionally filter by threat_id or detection type. Paginated: pass limit (default 15, max 100) and offset to page; the result includes has_more and an opaque next_cursor (reusable as offset/cursor).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Filter detections for a specific threat ID"
          },
          "type": {
            "type": "string",
            "description": "Detection type: spl, kql, or sigma"
          },
          "limit": {
            "type": "number",
            "description": "Max results (default 15, max 100)"
          },
          "offset": {
            "type": "number",
            "description": "Row offset for pagination (default 0). Or pass cursor from a prior result."
          },
          "cursor": {
            "type": "string",
            "description": "Opaque pagination cursor (next_cursor from a prior result). Decoded to an offset; ignored when offset is given."
          }
        }
      },
      "annotations": {
        "title": "Get Detections",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Detection ID — pass to get_detection_detail / export_detection."
                },
                "name": {
                  "type": "string"
                },
                "detection_type": {
                  "type": "string",
                  "description": "spl | kql | sigma"
                },
                "severity": {
                  "type": "string"
                },
                "threat_id": {
                  "type": "string",
                  "description": "Owning threat — pass to get_threat."
                }
              },
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/detections",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "search_iocs",
      "title": "Search IOCs",
      "description": "Search indicators of compromise (IPs, domains, hashes, URLs). Filter by value substring and/or category. Pass limit (default 25, max 100); the result includes has_more (true when the page is full, so more may exist). NOTE: the indicator endpoint does not yet honor offset — narrow with a more specific value/type substring rather than paging.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "Substring to match against IOC values"
          },
          "type": {
            "type": "string",
            "description": "IOC category (e.g. network, file, behavioral)"
          },
          "limit": {
            "type": "number",
            "description": "Max results (default 25, max 100)"
          }
        }
      },
      "annotations": {
        "title": "Search IOCs",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string"
                },
                "ioc_type": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "threat_id": {
                  "type": "string",
                  "description": "Owning threat — pass to get_threat."
                }
              },
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/iocs",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_mitre_coverage",
      "title": "MITRE Coverage",
      "description": "Get MITRE ATT&CK coverage across the platform. Optionally filter by tactic.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tactic": {
            "type": "string",
            "description": "Filter by ATT&CK tactic (e.g. \"initial-access\")"
          }
        }
      },
      "annotations": {
        "title": "MITRE Coverage",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "tactics": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "tactic": {
                  "type": "string"
                },
                "tactic_id": {
                  "type": "string"
                },
                "threat_count": {
                  "type": "integer"
                },
                "technique_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "total_techniques": {
            "type": "integer"
          },
          "top_techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string",
                  "description": "Pass to get_mitre_technique."
                },
                "technique": {
                  "type": "string"
                },
                "threat_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/mitre-matrix",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_mitre_technique",
      "title": "MITRE Technique",
      "description": "Get details for a specific MITRE ATT&CK technique by ID (e.g. T1059 or T1059.001): authoritative name, tactics, matrix, revocation status, mitigations, detection data sources, and the corpus threats using it. The threat list is paged — a heavily-used technique attaches hundreds of threats, so pass include_threats=false for the definition alone (a few KB), or limit/offset to page. threat_count always reports the true total.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "technique_id": {
            "type": "string",
            "description": "Technique ID (e.g. T1059 or T1059.001)"
          },
          "include_threats": {
            "type": "boolean",
            "description": "Set false to return the technique definition WITHOUT the threat list (default true). Use this when you only need the name/tactic/mitigations."
          },
          "limit": {
            "type": "number",
            "description": "Max threats to return (default 50, max 500)"
          },
          "offset": {
            "type": "number",
            "description": "Threat-list row offset for paging (default 0)"
          }
        },
        "required": [
          "technique_id"
        ]
      },
      "annotations": {
        "title": "MITRE Technique",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "technique_id": {
            "type": "string"
          },
          "technique": {
            "type": [
              "string",
              "null"
            ]
          },
          "tactic": {
            "type": [
              "string",
              "null"
            ]
          },
          "tactics": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "matrix": {
            "type": "string"
          },
          "revoked": {
            "type": "boolean"
          },
          "revoked_by": {
            "type": "string",
            "description": "Successor technique id when this one was retired — query that id instead."
          },
          "deprecated": {
            "type": "boolean"
          },
          "source": {
            "type": "string",
            "description": "'attack_catalog' (authoritative) | 'threat_mitre_fallback' | 'unknown'."
          },
          "parent_technique": {
            "type": [
              "string",
              "null"
            ]
          },
          "mitigations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "data_sources": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Pass to get_threat."
                },
                "title": {
                  "type": "string"
                },
                "severity_level": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "threat_count": {
            "type": "integer",
            "description": "TOTAL threats using this technique — compare against threats_returned to see whether the list is a page."
          },
          "threats_returned": {
            "type": "integer"
          },
          "threats_offset": {
            "type": "integer"
          },
          "threats_has_more": {
            "type": "boolean"
          },
          "threats_omitted": {
            "type": "boolean",
            "description": "Present and true when include_threats=false suppressed the list."
          },
          "detail_hint": {
            "type": "string"
          }
        },
        "required": [
          "technique_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_threat_enrichment",
      "title": "Threat Enrichment",
      "description": "Reference-grounded enrichment for one threat by ID: the malware families and tools used, targeted sectors/regions, affected operating systems, named campaigns, AI/ML (ATLAS) techniques, and per-technique mitigations + detection data sources. Complements get_threat (overview/MITRE/IOCs/detections) — call this for the \"what malware/tools were used and who was targeted\" view. Read `coverage` before acting on an empty array: grounded = the normalised association tables, threat_record = fell back to the threat's own target_sectors/target_regions, unmapped = NOT MAPPED, which is not the same as not targeted.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "title": "Threat Enrichment",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "malware": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Pass to get_malware_intelligence."
                },
                "type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "tools": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Pass to get_tool_intelligence."
                },
                "class": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "campaigns": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Pass to get_campaign_intelligence."
            }
          },
          "sectors": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "regions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "operating_systems": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "atlas": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "coverage": {
            "type": "object",
            "properties": {
              "malware": {
                "type": "string"
              },
              "tools": {
                "type": "string"
              },
              "sectors": {
                "type": "string",
                "description": "grounded | threat_record | unmapped"
              },
              "regions": {
                "type": "string",
                "description": "grounded | threat_record | unmapped"
              },
              "operating_systems": {
                "type": "string"
              },
              "campaigns": {
                "type": "string"
              },
              "atlas": {
                "type": "string"
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_malware_intelligence",
      "title": "Malware Intelligence",
      "description": "Pivot on a malware FAMILY by name (e.g. \"LockBit\", \"Vidar\", \"Emotet\"). Returns the canonical family + type, prevalence (threat/actor counts, first/last seen), the threats deploying it, the actors using it, and its most-common ATT&CK techniques. For an offensive TOOL (Cobalt Strike, Mimikatz) use get_tool_intelligence instead. Call resolve_entity first if unsure of the canonical name.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Malware family name (e.g. \"LockBit\", \"Vidar\")"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Malware Intelligence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "entity_type": {
            "type": "string"
          },
          "query": {
            "type": "string"
          },
          "matched": {
            "type": "boolean"
          },
          "canonical": {
            "type": "string"
          },
          "prevalence": {
            "type": "object",
            "properties": {
              "threat_count": {
                "type": "integer"
              },
              "threat_count_is_floor": {
                "type": "boolean",
                "description": "True when the membership fetch saturated, so threat_count under-counts."
              },
              "actor_count": {
                "type": "integer",
                "description": "TRUE distinct-actor prevalence, uncapped. The actors[] array is clipped to 20 — compare with actors_returned."
              },
              "actors_returned": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "membership": {
            "type": "object",
            "properties": {
              "grounded": {
                "type": "integer"
              },
              "title_match": {
                "type": "integer"
              },
              "total": {
                "type": "integer"
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "matched_via": {
                  "type": "string",
                  "description": "campaigns only: grounded | title | grounded+title"
                }
              },
              "additionalProperties": true
            }
          },
          "actors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "top_techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "matched"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_tool_intelligence",
      "title": "Tool Intelligence",
      "description": "Pivot on an offensive tool / utility / RMM / LOLBin by name (e.g. \"Cobalt Strike\", \"Mimikatz\", \"AnyDesk\", \"PsExec\"). Returns the canonical tool + class, prevalence, the threats and actors using it, and its most-common ATT&CK techniques. prevalence.actor_count is the TRUE distinct-actor total; the actors[] array is clipped to the top 20 (see prevalence.actors_returned) — do not read its length as the population.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Tool name (e.g. \"Cobalt Strike\", \"Mimikatz\")"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Tool Intelligence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "entity_type": {
            "type": "string"
          },
          "query": {
            "type": "string"
          },
          "matched": {
            "type": "boolean"
          },
          "canonical": {
            "type": "string"
          },
          "prevalence": {
            "type": "object",
            "properties": {
              "threat_count": {
                "type": "integer"
              },
              "threat_count_is_floor": {
                "type": "boolean",
                "description": "True when the membership fetch saturated, so threat_count under-counts."
              },
              "actor_count": {
                "type": "integer",
                "description": "TRUE distinct-actor prevalence, uncapped. The actors[] array is clipped to 20 — compare with actors_returned."
              },
              "actors_returned": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "membership": {
            "type": "object",
            "properties": {
              "grounded": {
                "type": "integer"
              },
              "title_match": {
                "type": "integer"
              },
              "total": {
                "type": "integer"
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "matched_via": {
                  "type": "string",
                  "description": "campaigns only: grounded | title | grounded+title"
                }
              },
              "additionalProperties": true
            }
          },
          "actors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "top_techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "matched"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_campaign_intelligence",
      "title": "Campaign Intelligence",
      "description": "Pivot on a named campaign / operation by name (e.g. \"Snowflake campaign\", \"ClickFix\"). Returns the threats in the campaign, the actors involved, prevalence, and common ATT&CK techniques. Membership is the UNION of the curated threat_campaign_refs table and threats whose own TITLE names the campaign, because the curated table is thin (ClickFix: 7 curated rows against 57 threats that name it). Each threat carries matched_via (grounded | title | grounded+title) and the response carries a `membership` breakdown — neither source is complete, so treat `title` rows as leads and check them before calling them members.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Campaign / operation name"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Campaign Intelligence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "entity_type": {
            "type": "string"
          },
          "query": {
            "type": "string"
          },
          "matched": {
            "type": "boolean"
          },
          "canonical": {
            "type": "string"
          },
          "prevalence": {
            "type": "object",
            "properties": {
              "threat_count": {
                "type": "integer"
              },
              "threat_count_is_floor": {
                "type": "boolean",
                "description": "True when the membership fetch saturated, so threat_count under-counts."
              },
              "actor_count": {
                "type": "integer",
                "description": "TRUE distinct-actor prevalence, uncapped. The actors[] array is clipped to 20 — compare with actors_returned."
              },
              "actors_returned": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "membership": {
            "type": "object",
            "properties": {
              "grounded": {
                "type": "integer"
              },
              "title_match": {
                "type": "integer"
              },
              "total": {
                "type": "integer"
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "matched_via": {
                  "type": "string",
                  "description": "campaigns only: grounded | title | grounded+title"
                }
              },
              "additionalProperties": true
            }
          },
          "actors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "top_techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "matched"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "resolve_entity",
      "title": "Resolve Canonical Name",
      "description": "Normalize an actor / malware / tool / sector / region / technique name or alias to its canonical reference form + stable UUID (e.g. \"fancy bear\" → \"APT28\"). Call this BEFORE pivoting (get_actor / get_malware_intelligence / get_tool_intelligence / search_threats) when unsure of the canonical name. Optional type narrows the lookup.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name or alias to resolve"
          },
          "type": {
            "type": "string",
            "description": "Optional: actor|malware|tool|sector|region|technique|campaign"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Resolve Canonical Name",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string"
          },
          "matched": {
            "type": "boolean"
          },
          "canonical": {
            "type": "string",
            "description": "Canonical name — feed to get_actor / get_malware_intelligence / get_tool_intelligence."
          },
          "entity_type": {
            "type": "string"
          },
          "uuid": {
            "type": "string"
          },
          "matched_via": {
            "type": "string"
          }
        },
        "required": [
          "query",
          "matched"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_actor",
      "title": "Get Actor Profile",
      "description": "Get a lean threat-actor profile by name or alias: actor metadata, attribution counts, attributed-threat summary rows, MITRE tactic rollup + technique ids, IOC category counts (no raw values), CVE/CWE/tool summaries, and relationships. Tactic keys are canonicalised (the corpus writes both \"Credential Access\" and \"credential-access\") and the rollup counts DISTINCT TECHNIQUES per tactic; mitre.technique_ids is capped at 60 against mitre.techniques_total. relationships splits into shared_infra / shared_techniques / shared_tooling with the type re-derived from the value, because corr_attribution types tool names as hashes. An empty actor_relationships means UNRECORDED, not unrelated — see actor_relationships_coverage. For heavy detail use the follow-up tools: get_threat(id) for a full threat, search_detections / get_detection_detail for detection bodies, search_iocs for IOC values, get_infrastructure_pivots for shared infrastructure.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Actor name or alias (e.g. 'APT29', 'Lazarus Group')"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Get Actor Profile",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "actor": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "aliases": {},
              "nation_state": {
                "type": "string"
              },
              "motivation": {
                "type": "string"
              },
              "confidence": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "counts": {
            "type": "object",
            "properties": {
              "threats": {
                "type": "integer"
              },
              "detections": {
                "type": "integer"
              },
              "iocs": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Pass to get_threat."
                },
                "title": {
                  "type": "string"
                },
                "severity": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "mitre": {
            "type": "object",
            "properties": {
              "technique_ids": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "tactic_summary": {
                "type": "object",
                "properties": {},
                "additionalProperties": true
              },
              "techniques_total": {
                "type": "integer",
                "description": "Distinct techniques for this actor. technique_ids is capped at 60 — compare the two before reading it as the whole footprint."
              },
              "techniques_returned": {
                "type": "integer"
              },
              "truncation_note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "cves": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "is_kev": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "tools": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "targets": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "relationships": {
            "type": "object",
            "properties": {
              "shared_infra": {
                "type": "array",
                "items": {}
              },
              "shared_techniques": {
                "type": "array",
                "items": {}
              },
              "shared_tooling": {
                "type": "array",
                "items": {}
              }
            },
            "additionalProperties": true
          },
          "actor_relationships": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "related_name": {
                  "type": "string"
                },
                "rel_type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "actor_relationships_coverage": {
            "type": "string",
            "description": "Present only when actor_relationships is empty: says the baseline has no row, not that the actor is unrelated."
          }
        },
        "required": [
          "actor"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/actor",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "search_actors",
      "title": "List Actors",
      "description": "List attributed threat actors with aggregate stats (threat_count, severity levels, categories, nation_state). Returns the full roster in one call, or narrow it with the optional tool / malware / sector filters (e.g. tool=\"Cobalt Strike\" → only actors that used it). Use get_actor for a single actor's full profile. Not paginated; the response carries a total count. Names are REPAIRED before they are returned: the corpus stores threat_actor as free text and comma-split it, so prose fragments and truncated parentheticals used to appear as adversaries — `label_hygiene` reports what was dropped and repaired. Two per-row flags matter: `role: \"co-mention\"` means the corpus never files a threat under that name as its primary attribution, and `also_grounded_as` means the corpus also records the name as a malware family or tool (e.g. SNOWLIGHT). Check both before reporting a row as an operator.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tool": {
            "type": "string",
            "description": "Only actors with a threat using this tool (e.g. \"Cobalt Strike\")"
          },
          "malware": {
            "type": "string",
            "description": "Only actors with a threat deploying this malware family (e.g. \"LockBit\")"
          },
          "sector": {
            "type": "string",
            "description": "Only actors with a threat targeting this sector (e.g. \"Healthcare\")"
          }
        }
      },
      "annotations": {
        "title": "List Actors",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "actors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Canonical actor name — pass to get_actor."
                },
                "nation_state": {
                  "type": "string"
                },
                "motivation": {
                  "type": "string"
                },
                "threat_count": {
                  "type": "integer"
                },
                "role": {
                  "type": "string",
                  "description": "primary = the corpus files at least one threat under this name. co-mention = it only ever appears alongside another actor, so it may be a mis-split label rather than an operator."
                },
                "also_grounded_as": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "merged_from": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "additionalProperties": true
            }
          },
          "label_hygiene": {
            "type": "object",
            "properties": {
              "raw_labels": {
                "type": "integer"
              },
              "actors": {
                "type": "integer"
              },
              "dropped": {
                "type": "integer",
                "description": "Labels rejected as comma-split sentence fragments, not adversaries."
              },
              "repaired": {
                "type": "integer",
                "description": "Labels whose truncated parenthetical was trimmed back to the name."
              },
              "dropped_labels": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_actor_relationships",
      "title": "Known Actor Links",
      "description": "The platform's baseline of ALREADY-DOCUMENTED links between threat actors (subgroup / overlaps / similar / linked-to) with both uuids and the source. Call this before claiming any actor-to-actor relationship is new — it is the only surface that says whether a link is public knowledge. CRITICAL: this table is sparse, covering a small minority of the corpus's actor labels (the response carries live coverage numbers). An empty result means the link is UNRECORDED, never that it was disproved or that the actors are unrelated. Use it to rule a claim out of NOVELTY, never to rule a relationship out of EXISTENCE. Matches both slots, so it also returns rows where your actor is the target — get_actor's relationship list does not.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "actor": {
            "type": "string",
            "description": "Optional: only rows naming this actor on either side (e.g. \"Lazarus Group\"). Omit to list the whole baseline."
          },
          "rel_type": {
            "type": "string",
            "description": "Optional: filter by relationship type. The response's coverage.rel_types lists what is actually present."
          },
          "limit": {
            "type": "integer",
            "description": "Default 50, max 200."
          }
        }
      },
      "annotations": {
        "title": "Known Actor Links",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "integer"
                },
                "actor_name": {
                  "type": "string"
                },
                "actor_uuid": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "related_name": {
                  "type": "string"
                },
                "related_uuid": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "rel_type": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "subgroup-of | overlaps | similar | linked-to"
                },
                "source": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "matched_slot": {
                  "type": "string",
                  "description": "Present only when `actor` was passed: 'actor_name' or 'related_name'."
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "integer"
          },
          "unrecorded": {
            "type": "boolean",
            "description": "Present and true when an `actor` filter matched nothing. Means UNRECORDED, not \"no relationships exist\"."
          },
          "unrecorded_note": {
            "type": "string"
          },
          "coverage": {
            "type": "object",
            "properties": {
              "total_rows": {
                "type": "integer"
              },
              "labels_named_in_table": {
                "type": "integer"
              },
              "corpus_actor_labels": {
                "type": "integer"
              },
              "corpus_actor_labels_with_a_row": {
                "type": "integer"
              },
              "corpus_coverage_pct": {
                "type": "number",
                "description": "Share of real corpus actor labels that have ANY row. Read the caveat before treating an empty result as meaningful."
              },
              "rel_types": {
                "type": "array",
                "items": {}
              }
            },
            "additionalProperties": true
          },
          "caveat": {
            "type": "string",
            "description": "Absence-is-not-evidence statement. Do not drop it when summarising."
          }
        },
        "required": [
          "data",
          "coverage",
          "caveat"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_entity_aliases",
      "title": "Entity Aliases (reverse)",
      "description": "Every alias the reference set maps to ONE entity — the reverse of resolve_entity, which only walks a single alias forward. Use it to check alias collision: the commonest reason two \"different actors\" turn out to be one. IMPORTANT: the source (MISP) OVER-MERGES — it folds subgroups into their parent, so \"andariel\" and \"bluenoroff\" both appear under \"Lazarus Group\". An alias entry is a MAPPING, not an assertion of identity. Each alias therefore carries `relation` (canonical|subgroup|alias), `other_entities` (how many other entities claim the same label) and `corpus_threats` (how many threats this platform files under that exact label); `corpus_uses_separately` lists labels the corpus treats as their own actor despite the merge. Accepts a name or a uuid.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name or alias to expand (e.g. \"andariel\"). Resolved exact-then-fuzzy, same ladder as resolve_entity."
          },
          "uuid": {
            "type": "string",
            "description": "Entity uuid, if you already have one from resolve_entity. Skips resolution."
          },
          "type": {
            "type": "string",
            "description": "Optional: actor|malware|tool|sector|region|technique|campaign — narrows name resolution."
          }
        }
      },
      "annotations": {
        "title": "Entity Aliases (reverse)",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "matched": {
            "type": "boolean"
          },
          "matched_via": {
            "type": [
              "string",
              "null"
            ],
            "description": "uuid | exact | fuzzy"
          },
          "uuid": {
            "type": "string"
          },
          "canonical": {
            "type": "string"
          },
          "entity_type": {
            "type": [
              "string",
              "null"
            ]
          },
          "cluster": {
            "type": [
              "string",
              "null"
            ]
          },
          "alias_count": {
            "type": "integer"
          },
          "aliases": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "alias": {
                  "type": "string"
                },
                "relation": {
                  "type": "string",
                  "description": "canonical | subgroup | alias — a mapping, NOT an assertion of identity."
                },
                "other_entities": {
                  "type": "integer",
                  "description": "Other entities claiming the same label. >0 means the merge is contested."
                },
                "corpus_threats": {
                  "type": "integer",
                  "description": "Threats this platform files under that exact label."
                }
              },
              "additionalProperties": true
            }
          },
          "corpus_uses_separately": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "caveat": {
            "type": "string",
            "description": "Over-merge warning. Do not drop it when summarising."
          }
        },
        "required": [
          "matched"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "list_campaigns",
      "title": "List Named Campaigns",
      "description": "Roster of NAMED campaigns/operations referenced by the corpus, with the actors, nation-states, date range and member threats behind each. Answers the campaign-lineage question the other tools cannot: get_campaign_intelligence needs you to already know a name, and get_graph_campaigns only reports the engine's own similarity clusters. Filter with min_actors to find campaigns carrying two or more distinct actors. Each member carries `text_supported` — whether the campaign name literally occurs in that threat's own record — because the underlying table has no provenance column and at least one row attaches a threat to a campaign with no textual basis, manufacturing a cross-nation link. Check `unsupported` and `cross_nation` before treating campaign co-membership as correlation evidence.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "min_actors": {
            "type": "integer",
            "description": "Only campaigns with at least this many DISTINCT actor labels (e.g. 2 for multi-actor campaigns)."
          },
          "limit": {
            "type": "integer",
            "description": "Default 50, max 200."
          }
        }
      },
      "annotations": {
        "title": "List Named Campaigns",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "campaign": {
                  "type": "string"
                },
                "misp_uuid": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "threat_count": {
                  "type": "integer"
                },
                "ref_count": {
                  "type": "integer"
                },
                "actor_count": {
                  "type": "integer"
                },
                "actors": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "nation_states": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "cross_nation": {
                  "type": "integer",
                  "description": "1 when members span more than one nation-state — check `unsupported` before believing it."
                },
                "first_seen": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "last_seen": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "supported_refs": {
                  "type": "integer"
                },
                "unsupported_refs": {
                  "type": "integer"
                },
                "unsupported": {
                  "type": "array",
                  "items": {}
                },
                "members": {
                  "type": "array",
                  "items": {}
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "integer"
          },
          "total": {
            "type": "integer"
          },
          "coverage": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "caveat": {
            "type": "string",
            "description": "Explains text_supported and its false negatives. Do not drop it when summarising."
          }
        },
        "required": [
          "data",
          "caveat"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_cve",
      "title": "Get CVE",
      "description": "Look up a CVE by identifier (e.g. CVE-2024-3400): description, CVSS v2/v3/v4, EPSS, CISA KEV status, exploitation flags (PoC/exploit/nuclei), weaknesses (CWE ids), affected products, references, and linked threats. `threat_ids` is the LIVE join over threats.cve_list (threat_ids_source says so; threat_ids_note appears when the stale derived index disagreed, and any ids only that index held are surfaced separately in threat_ids_derived_only rather than merged) — it is the same linkage get_cve_intelligence reports. Enumerated pre-release CPEs are collapsed into ranges (affected_products_raw_count gives the uncollapsed count). enrichment_status distinguishes a fully enriched record from one merely seeded from KEV, where blank CVSS/EPSS means NOT MEASURED rather than measured-absent. For linked threats WITH titles/actors/detections/velocity in one call, prefer get_cve_intelligence.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cve_id": {
            "type": "string",
            "description": "CVE identifier (e.g. CVE-2024-3400)"
          }
        },
        "required": [
          "cve_id"
        ]
      },
      "annotations": {
        "title": "Get CVE",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "enriched": {
            "type": "boolean",
            "description": "False when the CVE is unknown — then only cve_id/valid/reason are present."
          },
          "cve_id": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "cvss_v3": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "epss": {
            "type": "object",
            "properties": {
              "score": {
                "type": "number"
              },
              "percentile": {
                "type": "number"
              }
            },
            "additionalProperties": true
          },
          "kev": {
            "type": "object",
            "properties": {
              "is_kev": {
                "type": "boolean"
              },
              "is_ransomware": {
                "type": "boolean"
              }
            },
            "additionalProperties": true
          },
          "exploitation": {
            "type": "object",
            "properties": {
              "has_poc": {
                "type": "boolean"
              },
              "has_exploit": {
                "type": "boolean"
              },
              "has_nuclei": {
                "type": "boolean"
              }
            },
            "additionalProperties": true
          },
          "weaknesses": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "CWE ids — pass to get_cwe."
            }
          },
          "threat_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Threats referencing this CVE, from the LIVE threats.cve_list join — pass to get_threat."
            }
          },
          "threat_count": {
            "type": "integer"
          },
          "threat_ids_source": {
            "type": "string",
            "description": "Always 'threats.cve_list (authoritative live join)' when the join ran."
          },
          "threat_ids_note": {
            "type": "string",
            "description": "Present only when the derived cve_details.threat_ids reverse index disagreed with the live join."
          },
          "threat_ids_derived_only": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Ids the stale derived index held that the live join does not - unconfirmed historical linkage, deliberately NOT merged into threat_ids."
            }
          },
          "affected_products": {
            "type": "array",
            "items": {}
          },
          "affected_products_raw_count": {
            "type": "integer",
            "description": "Entries before pre-release CPE collapsing."
          },
          "enrichment_status": {
            "type": "string",
            "description": "'enriched' or 'not_enriched'. On 'not_enriched' a blank CVSS/EPSS/age_days means NOT MEASURED, not measured-empty."
          },
          "enrichment_note": {
            "type": "string",
            "description": "Present only on 'not_enriched'; names the seeding source."
          },
          "published_date": {
            "type": "string"
          }
        },
        "required": [
          "cve_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_cwe",
      "title": "Get CWE",
      "description": "Look up a CWE by identifier (e.g. CWE-79): weakness name, description, abstraction, MITRE likelihood_of_exploit, common consequences, detection methods, phased mitigations, related CWEs, the corpus threats that carry it, and related_cves - the corpus CVEs mapping to this weakness (top 20 by KEV then CVSS, with related_cve_count giving the true total; use search_vulnerabilities with cwe=<id> for the full list). NOTE: CWE has no CVSS severity - likelihood_of_exploit is the ontology's own High/Medium/Low rating, and severity_note says so; for scored severity read the related_cves rows or call get_cve. related_cves is null (never []) if the join could not run.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cwe_id": {
            "type": "string",
            "description": "CWE identifier (e.g. CWE-79)"
          }
        },
        "required": [
          "cwe_id"
        ]
      },
      "annotations": {
        "title": "Get CWE",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "enriched": {
            "type": "boolean",
            "description": "False when not found — then only cwe_id is present."
          },
          "cwe_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "abstraction": {
            "type": "string"
          },
          "likelihood_of_exploit": {
            "type": "string",
            "description": "MITRE's High/Medium/Low rating. CWE has NO CVSS severity — see severity_note."
          },
          "severity_note": {
            "type": "string"
          },
          "common_consequences": {
            "type": "array",
            "items": {}
          },
          "detection_methods": {
            "type": "array",
            "items": {}
          },
          "mitigations": {
            "type": "array",
            "items": {}
          },
          "related_cwes": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "De-duplicated CWE ids — pass to get_cwe."
            }
          },
          "threat_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Pass to get_threat."
            }
          },
          "related_cves": {
            "type": [
              "array",
              "null"
            ],
            "description": "Corpus CVEs mapping to this CWE (top 20, KEV then CVSS). NULL means the join could not run — it never means \"none exist\"; [] does.",
            "items": {
              "type": "object",
              "properties": {
                "cve_id": {
                  "type": "string",
                  "description": "Pass to get_cve."
                },
                "cvss": {
                  "type": [
                    "number",
                    "null"
                  ]
                },
                "severity": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "epss": {
                  "type": [
                    "number",
                    "null"
                  ]
                },
                "is_kev": {
                  "type": "boolean"
                },
                "is_ransomware": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "related_cve_count": {
            "type": [
              "integer",
              "null"
            ],
            "description": "True total mapping to this CWE, which can exceed the 20 returned."
          },
          "related_cves_note": {
            "type": "string"
          }
        },
        "required": [
          "cwe_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_platform_stats",
      "title": "Platform Stats",
      "description": "Get aggregate platform statistics: threat, detection, IOC, MITRE technique, and actor counts.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Platform Stats",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "total_threats": {
            "type": "integer"
          },
          "total_detections": {
            "type": "integer"
          },
          "total_iocs": {
            "type": "integer"
          },
          "total_ttps": {
            "type": "integer"
          },
          "total_actors": {
            "type": "integer"
          },
          "total_correlations": {
            "type": "integer"
          },
          "by_severity": {
            "type": "array",
            "items": {}
          },
          "by_category": {
            "type": "array",
            "items": {}
          },
          "top_techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "top_actors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "threat_actor": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_similar_threats",
      "title": "Similar Threats",
      "description": "Threats similar to a given threat, with the EVIDENCE behind each link: per-channel score breakdown, which signal dominates, the concrete shared techniques / IOCs / CVEs, and quality flags for stale or high-confidence-low-evidence links. Use explain_correlation for a full decomposition of one specific pair.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Source threat ID (e.g. TL-2026-0042)"
          },
          "limit": {
            "type": "number",
            "description": "Max results (default 10, max 20 — the handler caps here)."
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "title": "Similar Threats",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "source_threat_id": {
            "type": "string"
          },
          "count": {
            "type": "integer"
          },
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Neighbour threat ID — pass to get_threat."
                },
                "title": {
                  "type": "string"
                },
                "similarity_score": {
                  "type": "number"
                },
                "shared_techniques": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "shared_iocs": {
                  "type": "array",
                  "items": {}
                },
                "shared_cves": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "score_breakdown": {
                  "type": "object",
                  "properties": {},
                  "additionalProperties": true
                },
                "dominance": {},
                "signal_count": {
                  "type": "integer"
                },
                "is_stale": {
                  "type": "boolean"
                },
                "is_high_conf_low_signal": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "counts": {
            "type": "object",
            "properties": {
              "returned": {
                "type": "integer"
              },
              "limit": {
                "type": "integer"
              },
              "matched": {
                "type": "integer"
              },
              "has_more": {
                "type": "boolean"
              },
              "matched_is_floor": {
                "type": "boolean",
                "description": "True when the source queries saturated, so `matched` under-counts."
              }
            },
            "additionalProperties": true
          },
          "similar": {
            "type": "array",
            "items": {}
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/graph",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_landscape_briefing",
      "title": "Landscape Briefing",
      "description": "Get the latest threat-landscape briefing — a synthesized posture summary of recent threat activity. `latest` is the most recent briefing that is a REAL synthesis: the narrative model currently fails on most hourly runs, and a failed run still writes a one-bullet automated posture stub, so the newest row is usually not a summary at all. When a fallback is served the response says so (latest_is_fallback + fallback_note naming both dates) and `latest_age_hours` gives its age; `briefings[0]` is always the newest regardless of quality, and every row carries is_synthesis. narrative_ok reports whether the newest run produced a real narrative.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Landscape Briefing",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "briefings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "generated_at": {
                  "type": "string"
                },
                "headline": {
                  "type": "string"
                },
                "threat_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "is_synthesis": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "latest": {
            "type": [
              "object",
              "null"
            ],
            "description": "The most recent REAL synthesis (see latest_is_fallback)."
          },
          "top_viewed": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "narrative_ok": {
            "type": "boolean",
            "description": "Did the NEWEST run produce a real narrative?"
          },
          "latest_is_synthesis": {
            "type": "boolean"
          },
          "latest_generated_at": {
            "type": [
              "integer",
              "null"
            ]
          },
          "latest_age_hours": {
            "type": [
              "integer",
              "null"
            ]
          },
          "newest_generated_at": {
            "type": [
              "integer",
              "null"
            ]
          },
          "stub_count": {
            "type": "integer"
          },
          "page_size": {
            "type": "integer"
          },
          "latest_is_fallback": {
            "type": "boolean"
          },
          "fallback_note": {
            "type": "string",
            "description": "Names which date was served and which was skipped."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_daily_theme",
      "title": "Daily Theme",
      "description": "Get the recent daily landscape themes (newest first, 14 days) with each day's top 6 threat tags. `tags` is recomputed LIVE over that date's threats, ranked count-descending with an alphabetical tie-break, and `tags_source` says whether a row used the live rollup ('live'), the stored nightly snapshot ('snapshot') or had no tags at all ('none') — `tags_available` is the boolean. The theme SENTENCE is generated just after midnight ET, before the day's ingest finishes, so `theme_note`/`snapshot_threat_count` disclose how many of the day's threats it was actually written from; when they disagree, trust `tags`.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Daily Theme",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "themes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "date": {
                  "type": "string"
                },
                "theme": {
                  "type": "string"
                },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "tag": {
                        "type": "string"
                      },
                      "count": {
                        "type": "integer"
                      }
                    },
                    "additionalProperties": true
                  }
                },
                "tags_source": {
                  "type": "string",
                  "description": "live | snapshot | none."
                },
                "tags_available": {
                  "type": "boolean"
                },
                "threat_count": {
                  "type": "integer",
                  "description": "Live count of that date's threats."
                },
                "snapshot_threat_count": {
                  "type": "integer",
                  "description": "How many threats existed when the theme sentence was written."
                },
                "theme_note": {
                  "type": "string",
                  "description": "Present when the sentence was written from fewer threats than the day ended with."
                }
              },
              "additionalProperties": true
            }
          },
          "yesterday": {
            "type": [
              "object",
              "null"
            ]
          },
          "tags_note": {
            "type": "string"
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_threat_level",
      "title": "Threat Level",
      "description": "Get the computed current threat-landscape level (a 0–25 rating of overall posture).",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Threat Level",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "score": {
            "type": "number"
          },
          "max": {
            "type": "number"
          },
          "level": {
            "type": "string"
          },
          "threats_observed": {
            "type": "integer"
          },
          "criteria": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "key": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                },
                "points": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "score",
          "level"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_ioc_blast_radius",
      "title": "IOC Blast Radius",
      "description": "Map the blast radius of one indicator: the threats that contain it, the MITRE techniques those threats use, and the actors + sibling IOCs in the same campaigns. Matching is case-insensitive, and for a CVE the threat ring is the UNION of indicator rows and threats.cve_list (the authoritative CVE-to-threat mapping) — `coverage` reports which of the two produced how many, so a count can be traced to its source. `edge_scores` is a sampled graph_edges projection for fidelity context, never the denominator. Use this to scope impact of a single IOC; for a richer multi-source dossier on one indicator use get_ioc_intelligence instead.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "Indicator value (IP, domain, hash, URL, or CVE-XXXX-NNNN)"
          },
          "depth": {
            "type": "number",
            "description": "Traversal rings to expand (1–3, default 3): 1=threats, 2=+techniques, 3=+actors & sibling IOCs"
          }
        },
        "required": [
          "value"
        ]
      },
      "annotations": {
        "title": "IOC Blast Radius",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "center": {
            "type": "string"
          },
          "rings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "ring": {
                  "type": "integer"
                },
                "type": {
                  "type": "string"
                },
                "nodes": {}
              },
              "additionalProperties": true
            }
          },
          "edge_scores": {
            "type": "array",
            "items": {}
          },
          "stats": {
            "type": "object",
            "properties": {
              "total_threats": {
                "type": "integer"
              },
              "total_techniques": {
                "type": "integer"
              },
              "total_actors": {
                "type": "integer"
              },
              "sibling_iocs": {
                "type": "integer"
              },
              "rings": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "coverage": {
            "type": "object",
            "properties": {
              "center_is_cve": {
                "type": "boolean"
              },
              "ring1_from_ioc_rows": {
                "type": "integer",
                "description": "Threats reached via a threat_iocs row carrying this exact value."
              },
              "ring1_from_cve_list": {
                "type": "integer",
                "description": "Threats reached via threats.cve_list, the authoritative CVE-to-threat mapping. Ring 1 is the UNION of the two, not either alone."
              },
              "depth_requested": {
                "type": "integer"
              },
              "sibling_iocs_capped": {
                "type": "boolean"
              },
              "source": {
                "type": "string"
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "center"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_ioc_intelligence",
      "title": "IOC Intelligence Dossier",
      "description": "Get the composite intelligence dossier for one indicator: linked threats, actor attribution, related IOCs, and enrichment context in a single call. Prefer this over search_iocs when you already have an exact indicator value and want its full story.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "Exact indicator value (IP, domain, hash, or URL)"
          }
        },
        "required": [
          "value"
        ]
      },
      "annotations": {
        "title": "IOC Intelligence Dossier",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "ioc_value": {
            "type": "string"
          },
          "threat_count": {
            "type": "integer"
          },
          "truncated": {
            "type": "boolean"
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Pass to get_threat."
                },
                "title": {
                  "type": "string"
                },
                "ioc_type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "dns_records": {
            "type": "array",
            "items": {}
          },
          "infrastructure_pivots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "ioc_value_a": {
                  "type": "string"
                },
                "ioc_value_b": {
                  "type": "string"
                },
                "link_type": {
                  "type": "string"
                },
                "confidence": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
          },
          "consensus_score": {
            "type": [
              "object",
              "null"
            ],
            "description": "Multi-feed consensus; null when no feed has seen it."
          },
          "osint": {
            "type": [
              "object",
              "null"
            ]
          }
        },
        "required": [
          "ioc_value"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_ioc_dns",
      "title": "IOC DNS Enrichment",
      "description": "Return stored DNS enrichment for an IP or domain indicator (reverse-IP and subdomain records previously resolved and cached in the platform dataset). This reads stored data — it is NOT a live lookup at call time. Use get_ioc_intelligence for the full stored dossier.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "IP address or domain (stored DNS enrichment lookup)"
          }
        },
        "required": [
          "value"
        ]
      },
      "annotations": {
        "title": "IOC DNS Enrichment",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "query_value": {
            "type": "string"
          },
          "total": {
            "type": "integer"
          },
          "domains": {
            "type": "array",
            "items": {}
          },
          "cross_links": {
            "type": "array",
            "items": {}
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_infrastructure_pivots",
      "title": "Infrastructure Pivots",
      "description": "For a given threat, surface cross-threat infrastructure links — shared IPs/domains/hashes and DNS-derived overlaps that tie it to other campaigns. Derived from the SAME indicator universe the correlation graph scores, so a pivot here and an ioc-basis edge in explain_correlation agree. Each pivot carries value_threat_count (2 = the value is nearly unique to this pair; 40 = commodity such as a Run key) and a rarity-derived confidence — read those before calling an overlap a link. `coverage` gives the denominator: pivot_count 0 with scorable_iocs > 0 is a REAL negative, pivot_count 0 with scorable_iocs 0 only means the threat carries no pivotable indicator. Labels (malware family, tool name, technique) are deliberately not pivotable — two write-ups naming the same family observed nothing in common. Use get_similar_threats for TTP/actor-based similarity instead.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Infrastructure Pivots",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "pivot_count": {
            "type": "integer"
          },
          "dns_record_count": {
            "type": "integer"
          },
          "infrastructure_pivots": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "from_ioc": {
                  "type": "string"
                },
                "to_ioc": {
                  "type": "string"
                },
                "link_type": {
                  "type": "string"
                },
                "pivot_value": {
                  "type": "string"
                },
                "ioc_type": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "confidence": {
                  "type": "number",
                  "description": "Rarity-derived (Adamic-Adar) for shared_ioc rows; hand-set for curated_link rows."
                },
                "value_threat_count": {
                  "type": "number",
                  "description": "How many threats corpus-wide carry this value — 2 is a strong pivot, 40 is commodity."
                },
                "source": {
                  "type": "string",
                  "description": "'shared_ioc' (derived from the same indicator universe the correlation graph scores) or 'curated_link'."
                },
                "related_threat": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    }
                  },
                  "additionalProperties": true
                }
              },
              "additionalProperties": true
            }
          },
          "dns_trail": {
            "type": "array",
            "items": {}
          },
          "coverage": {
            "type": "object",
            "properties": {
              "ioc_rows": {
                "type": "number"
              },
              "ioc_values_examined": {
                "type": "number"
              },
              "scorable_iocs": {
                "type": "number"
              },
              "threats_compared": {
                "type": "number"
              },
              "threats_touched": {
                "type": "number"
              },
              "shared_ioc_pivots": {
                "type": "number"
              },
              "curated_link_pivots": {
                "type": "number"
              },
              "common_values_excluded": {
                "type": "number"
              },
              "rarity_cap": {
                "type": "number"
              },
              "truncated": {
                "type": "boolean"
              },
              "dns_enriched": {
                "type": "boolean"
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "threat_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_osint",
      "title": "Get OSINT Corroboration",
      "description": "Community corroboration for a threat or an indicator from the TL_OSINT_Scan layer (tweetfeed.live, CC0). Given threat_id, returns the matched community tags, the corroborated indicator count, and whether the community saw an indicator BEFORE our report. Given ioc_value, returns sightings, reporters, tags and every linked threat. Community-sourced and heavily concentrated (~73% of recent submissions come from a single reporter) — treat as corroborating evidence, never as authoritative attribution.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-1531). Returns the per-threat corroboration block."
          },
          "ioc_value": {
            "type": "string",
            "description": "Exact indicator (IP, domain, URL, MD5 or SHA256). Returns the community lookup + our linked threats."
          }
        }
      },
      "annotations": {
        "title": "Get OSINT Corroboration",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Present on the per-threat shape."
          },
          "scanned": {
            "type": "boolean"
          },
          "corroborated": {
            "type": "integer"
          },
          "indicator_count": {
            "type": "integer"
          },
          "lead_days": {
            "type": [
              "number",
              "null"
            ],
            "description": "Days the community saw an indicator before our report."
          },
          "community_seen_before_report": {
            "type": "boolean"
          },
          "matched_tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "reporters": {
            "type": "array",
            "items": {}
          },
          "value": {
            "type": "string",
            "description": "Present on the per-IOC shape (ioc_value input)."
          },
          "threat_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Pass to get_threat."
            }
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "search_xscan_indicators",
      "title": "Search Community Indicators",
      "description": "Search the canonical community-indicator set (TL_OSINT_Scan / tweetfeed.live, CC0) — indicators the community reported that were also matched against our corpus. Filter by tag, type, ASN, country, minimum linked-threat count, or a value substring. There is deliberately NO family filter: the upstream AI family field is populated on under 1% of rows, so a family argument would return nothing. Use tag instead (community tags carry the family signal). Community-sourced and heavily concentrated (~73% of recent submissions come from a single reporter) — corroborating, not authoritative.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tag": {
            "type": "string",
            "description": "Community tag substring, case-insensitive and normalized (e.g. phishing, asyncrat, c2)"
          },
          "type": {
            "type": "string",
            "enum": [
              "ip",
              "domain",
              "url",
              "sha256",
              "md5"
            ],
            "description": "Indicator type"
          },
          "asn": {
            "type": "string",
            "description": "Autonomous system, e.g. AS14061"
          },
          "country": {
            "type": "string",
            "description": "Two-letter country code, e.g. RU"
          },
          "min_threats": {
            "type": "number",
            "description": "Only indicators linked to at least this many of our threats"
          },
          "q": {
            "type": "string",
            "description": "Substring match on the indicator value"
          },
          "limit": {
            "type": "number",
            "description": "Max rows (default 25, max 100)"
          },
          "offset": {
            "type": "number",
            "description": "Row offset for paging"
          }
        }
      },
      "annotations": {
        "title": "Search Community Indicators",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "first_seen": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_c2",
      "title": "C2 Intelligence",
      "description": "Query the live C2 (command-and-control) intelligence center. Pick a view: 'beacons' (active C2 beacon snapshots — default), 'configs' (full extracted C2 configs), 'operators' (operator clusters), 'watermarks' (Cobalt Strike watermark index), 'correlations' (cross-C2 correlations), 'timeline' (activity over time), 'stats' (aggregate counts). Use generate_c2_blocklist when you want firewall-ready output rather than raw records.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string",
            "enum": [
              "beacons",
              "configs",
              "operators",
              "watermarks",
              "correlations",
              "timeline",
              "stats"
            ],
            "description": "Which C2 dataset to return (default 'beacons')"
          },
          "limit": {
            "type": "number",
            "description": "Max records for the record-bearing views — beacons (default 50), configs (default 25), correlations (default 25). Max 100."
          },
          "offset": {
            "type": "number",
            "description": "Skip this many records — 'correlations' only; the aggregate summary block stays whole across pages."
          }
        }
      },
      "annotations": {
        "title": "C2 Intelligence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "items": {
            "type": "array",
            "items": {}
          },
          "total": {
            "type": "integer"
          },
          "configs": {
            "type": "array",
            "items": {}
          },
          "aggregates": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "clusters": {
            "type": "array",
            "items": {}
          },
          "watermarks": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "correlations": {
            "type": "array",
            "items": {}
          },
          "months": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "versions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "data": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "beacons": {
            "type": "integer"
          },
          "countries": {
            "type": "integer"
          },
          "asns": {
            "type": "integer"
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/c2",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "generate_c2_blocklist",
      "title": "Generate C2 Blocklist",
      "description": "Compile a firewall-ready C2 blocklist of active command-and-control IPs observed recently. Returns deduplicated network indicators ready to drop into a denylist. Use this for actionable blocking; use get_c2 with view=\"beacons\" when you need the underlying beacon detail.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Generate C2 Blocklist",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "generated_at": {
            "type": "string"
          },
          "since_days": {
            "type": "integer"
          },
          "count": {
            "type": "integer"
          },
          "cidrs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "detail": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "ip": {
                  "type": "string"
                },
                "country": {
                  "type": "string"
                },
                "asn": {
                  "type": "string"
                },
                "last_seen": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "count"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_correlations",
      "title": "Correlation Engine",
      "description": "Read precomputed cross-dataset correlations. Choose an engine: 'overview' (rollup of all engines — default), 'mitre-heatmap', 'adversary-infra', 'ioc-consensus', 'cve-velocity', 'attribution', 'detection-debt', or 'enrichment'. Use 'overview' first to see what's available, then drill into a specific engine.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "engine": {
            "type": "string",
            "enum": [
              "overview",
              "mitre-heatmap",
              "adversary-infra",
              "ioc-consensus",
              "cve-velocity",
              "attribution",
              "detection-debt",
              "enrichment"
            ],
            "description": "Which correlation engine to read (default 'overview')"
          },
          "limit": {
            "type": "number",
            "description": "Paged engines only ('mitre-heatmap', 'ioc-consensus', 'detection-debt'): max rows, pre-ordered by score (default 50; max 200 for mitre-heatmap, 500 for the others). The summary block always covers the full set."
          },
          "offset": {
            "type": "number",
            "description": "Paged engines only: skip this many rows."
          }
        }
      },
      "annotations": {
        "title": "Correlation Engine",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "engines": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "sync_log": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "techniques": {
            "type": "array",
            "items": {}
          },
          "infrastructure": {
            "type": "array",
            "items": {}
          },
          "iocs": {
            "type": "array",
            "items": {}
          },
          "cves": {
            "type": "array",
            "items": {}
          },
          "shared_entities": {
            "type": "array",
            "items": {}
          },
          "sources": {
            "type": "array",
            "items": {}
          },
          "summary": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "predict_mitre_transitions",
      "title": "Predict MITRE Transitions",
      "description": "Predict the MITRE ATT&CK techniques most likely to follow (or precede) a given technique, with probabilities and example threats. Each row carries order_basis: 'attack_flow' rows come from analyst-authored ATT&CK Flow DAGs (real asserted causality), 'mitre_canonical' rows are inferred by sorting a threat's flat technique set by canonical tactic rank, and 'blended' rows have both. Prefer attack_flow evidence: ~24% of real transitions run against canonical tactic order and are inexpressible by the canonical basis. Use forward to anticipate the next step; reverse to infer what came before.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "technique_id": {
            "type": "string",
            "description": "Source technique ID (e.g. T1059 or T1059.001)"
          },
          "direction": {
            "type": "string",
            "enum": [
              "forward",
              "reverse"
            ],
            "description": "'forward' = techniques that typically follow (default); 'reverse' = techniques that typically precede"
          },
          "top_n": {
            "type": "number",
            "description": "Max transitions to return (default 5, max 20)"
          },
          "basis": {
            "type": "string",
            "enum": [
              "any",
              "attack_flow",
              "blended",
              "mitre_canonical"
            ],
            "description": "Filter by evidence basis. Default 'any' (unfiltered, byte-identical to previous behaviour). Use 'attack_flow' for authored-causality rows only."
          }
        }
      },
      "annotations": {
        "title": "Predict MITRE Transitions",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "technique_id": {
            "type": "string"
          },
          "direction": {
            "type": "string"
          },
          "total": {
            "type": "integer"
          },
          "data": {
            "type": "array",
            "items": {}
          },
          "transitions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "related_technique": {
                  "type": "string",
                  "description": "Pass to get_mitre_technique."
                },
                "probability": {
                  "type": "number"
                },
                "transition_count": {
                  "type": "integer"
                },
                "from_tactic": {
                  "type": "string"
                },
                "to_tactic": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "technique_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_attack_flow",
      "title": "Attack Flow",
      "description": "Get the analyst-authored MITRE ATT&CK Flow for a threat: a causal DAG of actions, conditions, operators and assets, with per-node technique ids, tactics and descriptions. This is asserted causality — what actually caused what — not a flat technique list. Check `generator`: 'harness' is authored, 'derived' is timeline ORDERING and must not be read as causality. Use get_flow_similar_threats to find threats sharing a causal sequence.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-1916)"
          },
          "view": {
            "type": "string",
            "enum": [
              "ir",
              "nodes"
            ],
            "description": "'ir' (default) returns the compact flow IR plus validation findings; 'nodes' returns the denormalized node/edge/asset projection with technique and tactic columns already joined."
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Attack Flow",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "generator": {
            "type": "string",
            "description": "'harness' = analyst-authored causality. 'derived' = timeline ORDERING only — must not be read as causality. 'unknown' = published before provenance was tracked; treat as not authoritative."
          },
          "node_count": {
            "type": "number"
          },
          "flow_valid": {
            "type": "boolean"
          },
          "flow_errors": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "flow_warnings": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "flow": {
            "type": "object",
            "properties": {
              "v": {
                "type": "number"
              },
              "scope": {
                "type": "string"
              },
              "start": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "nodes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string"
                    },
                    "kind": {
                      "type": "string",
                      "description": "action | condition | operator | asset"
                    },
                    "name": {
                      "type": "string"
                    },
                    "desc": {
                      "type": "string"
                    },
                    "tid": {
                      "type": "string",
                      "description": "ATT&CK technique id (action nodes)."
                    },
                    "tactic": {
                      "type": "string"
                    },
                    "op": {
                      "type": "string",
                      "description": "AND | OR (operator nodes). An operator JOINS its incoming edges."
                    }
                  },
                  "additionalProperties": true
                }
              },
              "edges": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "from": {
                      "type": "string"
                    },
                    "to": {
                      "type": "string"
                    },
                    "when": {
                      "type": "string",
                      "description": "'true' | 'false' on edges out of a condition."
                    }
                  },
                  "additionalProperties": true
                }
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "threat_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_flow_similar_threats",
      "title": "Flow-Similar Threats",
      "description": "Find threats that share a causal SEQUENCE of techniques with this one, scored by ordered-bigram cosine over ATT&CK Flow transitions. This sees what no other channel can: every existing similarity signal compares flat sets, so two threats can share an identical attack ORDER while sharing no indicator, CVE or actor. Returns the shared transitions (e.g. 'T1003>T1021') so the claim is inspectable. Scored independently and NOT folded into get_similar_threats' blended score.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-1916)"
          },
          "limit": {
            "type": "integer",
            "description": "Max neighbours (default 20, max 100)"
          },
          "min_score": {
            "type": "number",
            "description": "Drop neighbours below this sim_flow (0-1)"
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Flow-Similar Threats",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "threat_id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                },
                "threat_actor": {
                  "type": "string"
                },
                "nation_state": {
                  "type": "string"
                },
                "sim_flow": {
                  "type": "number",
                  "description": "Ordered-bigram cosine over flow transitions, 0-1."
                },
                "shared_bigrams": {
                  "type": "number"
                },
                "shared_transitions": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "number"
          },
          "reason": {
            "type": "string",
            "description": "Present only when data is empty; distinguishes \"no flow published\" from \"flow published, no neighbours\"."
          }
        },
        "required": [
          "threat_id",
          "data"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_flow_coverage",
      "title": "Flow Coverage",
      "description": "How much of the corpus carries an authored ATT&CK Flow, split by provenance, plus flow node/transition/path-similarity totals and whether the flow similarity channel has met its coverage gate. Call this before reasoning over flow data so you know the denominator — flow-derived findings only speak to the covered slice.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Flow Coverage",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threats": {
            "type": "number"
          },
          "flows": {
            "type": "number"
          },
          "authored": {
            "type": "number",
            "description": "Flows with generator='harness'. Only these assert causality."
          },
          "coverage_pct": {
            "type": "number",
            "description": "Authored flows as a percentage of the corpus — the denominator for any flow-derived claim."
          },
          "by_generator": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "generator": {
                  "type": "string"
                },
                "c": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
          },
          "flow_nodes": {
            "type": "number"
          },
          "flow_transitions": {
            "type": "number"
          },
          "path_similarity_pairs": {
            "type": "number"
          },
          "channel": {
            "type": "object",
            "properties": {
              "enabled": {
                "type": "boolean"
              },
              "coverage_gate_pct": {
                "type": "number"
              },
              "gate_met": {
                "type": "boolean"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "threats",
          "flows",
          "coverage_pct"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_d3fend_posture",
      "title": "D3FEND Posture",
      "description": "Get the defensive twin of a threat's ATT&CK mapping: offensive technique to digital artifact to D3FEND countermeasure, plus coverage by defensive tactic. Use to answer 'what would have stopped this'. COVERAGE: 197 of 1,891 threats carry a mapping, so absence is common and is not an error — a threat that exists with no mapping answers 200 with an empty `mappings` and a `reason` saying whether it has no techniques at all or techniques the ontology has no countermeasure for; only an unknown threat id answers 404. IMPORTANT: this is a deterministic projection of the threat's techniques through a static ontology — two threats sharing countermeasures almost always just share techniques, so never treat countermeasure overlap as independent correlation evidence.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-1916)"
          },
          "limit": {
            "type": "integer",
            "description": "Raw technique x countermeasure pairs in `mappings` (default 60, max 500). `countermeasures` always rolls up ALL pairs regardless, so the default loses no information — raise this only if you need the individual pairings."
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "D3FEND Posture",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "mappings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "off_technique_id": {
                  "type": "string",
                  "description": "The ATT&CK technique this countermeasure answers."
                },
                "off_technique_base": {
                  "type": "string"
                },
                "off_artifact": {
                  "type": "string"
                },
                "def_artifact": {
                  "type": "string",
                  "description": "The digital artifact — this axis is the genuinely new signal."
                },
                "def_artifact_rel": {
                  "type": "string"
                },
                "def_tech_id": {
                  "type": "string",
                  "description": "D3FEND countermeasure id, e.g. D3-ULA."
                },
                "def_tech_label": {
                  "type": "string"
                },
                "def_tactic": {
                  "type": "string",
                  "description": "D3FEND defensive tactic: Model / Harden / Detect / Isolate / Deceive / Evict / Restore."
                },
                "ontology_version": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "coverage": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "def_tactic": {
                  "type": "string"
                },
                "countermeasures": {
                  "type": "number"
                },
                "techniques": {
                  "type": "number"
                },
                "artifacts": {
                  "type": "number"
                },
                "top_json": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "number",
            "description": "TOTAL technique x countermeasure pairs, not the number returned in `mappings`."
          },
          "mappings_returned": {
            "type": "number"
          },
          "mappings_truncated": {
            "type": "boolean",
            "description": "True when `mappings` was capped; `countermeasures` still covers every pair."
          },
          "countermeasures": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "def_tech_id": {
                  "type": "string"
                },
                "def_tech_label": {
                  "type": "string"
                },
                "def_tactic": {
                  "type": "string"
                },
                "offensive_techniques": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "pair_count": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
          },
          "countermeasure_count": {
            "type": "number"
          },
          "detail_hint": {
            "type": "string"
          },
          "offensive_technique_count": {
            "type": "number",
            "description": "Distinct ATT&CK techniques on the threat — the denominator the projection ran over."
          },
          "reason": {
            "type": "string",
            "description": "Present only on the 200-with-zero-mappings case: says WHY there is no posture (no techniques mapped vs techniques with no countermeasure)."
          },
          "error": {
            "type": "string",
            "description": "Present only on 404 ('threat not found'). A threat that exists but has no mapping answers 200, never 404."
          },
          "caveat": {
            "type": "string",
            "description": "States that this is a deterministic projection of threat_mitre, not independent evidence."
          }
        },
        "required": [
          "threat_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_atlas_intelligence",
      "title": "ATLAS (Adversarial ML)",
      "description": "MITRE ATLAS technique co-occurrence for threats that attack AI/ML systems — prompt injection, agent-tool abuse, context and memory poisoning, cost harvesting. `data` returns pairs whose BOTH endpoints are real ATLAS ids (^AML.), with cooccurrence_count, support, confidence and lift; free-text publish labels (\"Prompt Injection\", \"Tool Poisoning\") are returned SEPARATELY in `tag_pairs` and are not ATLAS techniques. SMALL-N WARNING: the corpus holds 106 pairs of which only 10 were observed more than once, so min_cooccurrence defaults to 2. Lower it and you get rows where confidence=1.0 and lift=1/support are arithmetic on a single observation — those carry single_observation:true; do not report them as associations. Ranked by cooccurrence_count, then lift.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Max pairs per list (default 50, max 100)"
          },
          "min_cooccurrence": {
            "type": "integer",
            "description": "Minimum times the two techniques were seen together. Default 2 (the honest set). 1 includes single-observation pairs, which are flagged single_observation:true."
          }
        }
      },
      "annotations": {
        "title": "ATLAS (Adversarial ML)",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "atlas_a": {
                  "type": "string",
                  "description": "Real ATLAS id (^AML.) — both endpoints in `data` are guaranteed to match."
                },
                "atlas_b": {
                  "type": "string"
                },
                "cooccurrence_count": {
                  "type": "integer",
                  "description": "Threats in which BOTH techniques appear. The primary ranking key — support/confidence/lift are only interpretable above 1."
                },
                "support": {
                  "type": "number"
                },
                "confidence_ab": {
                  "type": "number"
                },
                "confidence_ba": {
                  "type": "number"
                },
                "lift": {
                  "type": "number"
                },
                "single_observation": {
                  "type": "boolean",
                  "description": "True when cooccurrence_count is 1 — confidence 1.0 and lift 1/support are then arithmetic, not evidence."
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "number"
          },
          "tag_pairs": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "atlas_a": {
                  "type": "string"
                },
                "atlas_b": {
                  "type": "string"
                },
                "cooccurrence_count": {
                  "type": "integer"
                },
                "single_observation": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "tag_pair_count": {
            "type": "number"
          },
          "filters": {
            "type": "object",
            "properties": {
              "min_cooccurrence": {
                "type": "integer"
              },
              "limit": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "pairs": {
            "type": "object",
            "properties": {
              "total": {
                "type": "integer"
              },
              "repeated": {
                "type": "integer",
                "description": "Pairs seen more than once — the honest denominator."
              },
              "passing_min": {
                "type": "integer"
              },
              "atlas_id_pairs": {
                "type": "integer"
              },
              "tag_pairs": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "corpus": {
            "type": "object",
            "properties": {
              "rows": {
                "type": "number"
              },
              "threats": {
                "type": "number"
              },
              "techniques": {
                "type": "number"
              },
              "atlas_techniques": {
                "type": "number",
                "description": "Distinct real AML.* ids — the rest of `techniques` are free-text labels."
              }
            },
            "additionalProperties": true
          },
          "note": {
            "type": "string"
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_threat_simulations",
      "title": "Threat Simulations",
      "description": "DEPRECATED (generation stopped 2026-08-03; ~5,362 archived rows still served, no new ones are produced) — the response carries deprecated:true and the caveat inline. Adversary-emulation playbooks attached to a threat. Most were synthetic-telemetry generators against local mocks rather than real execution, so they could not trigger the platform's own detections. One threat's playbooks can run 30 KB+ of command text: narrow with platform (see available_platforms) and limit. An empty result carries a `reason` distinguishing \"this threat never had any\" from \"none for that platform\". Prefer get_attack_flow, which returns the analyst-authored causal DAG that replaced them.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          },
          "platform": {
            "type": "string",
            "description": "Return only this platform: windows, linux, python (also aws, macos, multi on a few rows). Omit for all."
          },
          "limit": {
            "type": "number",
            "description": "Max playbooks to return (max 50). Omit for all — bodies are large."
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Threat Simulations",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "deprecated": {
            "type": "boolean"
          },
          "generation_stopped": {
            "type": "string",
            "description": "Date generation stopped (2026-08-03)."
          },
          "caveat": {
            "type": "string",
            "description": "Why these do not prove your detections fire."
          },
          "simulations": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "platform": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "commands": {},
                "caution_level": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "total_simulations": {
            "type": "integer",
            "description": "All archived playbooks for this threat, before platform/limit."
          },
          "matched": {
            "type": "integer"
          },
          "returned": {
            "type": "integer"
          },
          "truncated": {
            "type": "boolean"
          },
          "available_platforms": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "reason": {
            "type": "string",
            "description": "Present only on an empty result: no_simulations_for_threat | no_simulations_for_platform."
          },
          "platforms": {
            "type": "object",
            "properties": {
              "windows": {
                "type": "array",
                "items": {}
              },
              "linux": {
                "type": "array",
                "items": {}
              },
              "python": {
                "type": "array",
                "items": {}
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "threat_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "list_debriefs",
      "title": "List Debriefs",
      "description": "List recent daily intelligence debriefs (newest first) with their per-day rollups: new/updated threats, the day's theme, top categories and actors, severity counts, mitre_technique_count (+ mitre_techniques_sample, the first 10 of an alphabetically-sorted ID list — NOT a top-10), and ioc_breakdown by type with ioc_total. Enough to pick the day worth drilling into without fetching each one; use get_debrief for a date's full detail (all techniques, per-threat lists, highlights). Pass limit (default 30, max 100); the result includes has_more (true when the page is full, so older debriefs may exist). NOTE: the debriefs endpoint does not yet honor offset — it serves the most recent window.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "description": "Max debriefs to return (default 30, max 100)"
          }
        }
      },
      "annotations": {
        "title": "List Debriefs",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "date": {
                  "type": "string",
                  "description": "YYYY-MM-DD — pass to get_debrief."
                },
                "daily_theme": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "new_threats": {
                  "type": "integer"
                },
                "updated_threats": {
                  "type": "integer"
                },
                "total_threats": {
                  "type": "integer"
                },
                "new_detections": {
                  "type": "integer"
                },
                "severity_counts": {
                  "type": [
                    "object",
                    "null"
                  ]
                },
                "top_categories": {
                  "type": "array",
                  "items": {}
                },
                "top_actors": {
                  "type": "array",
                  "items": {}
                },
                "mitre_technique_count": {
                  "type": "integer"
                },
                "mitre_techniques_sample": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "ioc_breakdown": {
                  "type": [
                    "object",
                    "null"
                  ],
                  "description": "IOC counts keyed by type (network, file, infrastructure, …)."
                },
                "ioc_total": {
                  "type": [
                    "integer",
                    "null"
                  ]
                }
              },
              "additionalProperties": true
            }
          },
          "has_more": {
            "type": "boolean",
            "description": "True when another page may exist."
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ],
            "description": "Opaque cursor for the next page, or null when this is the last page or the endpoint ignores offset."
          },
          "total": {
            "type": "integer",
            "description": "Total matching rows, when the handler reports one."
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_debrief",
      "title": "Get Debrief",
      "description": "Get the full daily intelligence debrief for a specific calendar date (YYYY-MM-DD): posture summary, themes, threats grouped by severity, MITRE coverage, IOC distribution, actor attribution, and detection status. Find available dates first with list_debriefs.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "description": "Debrief date in YYYY-MM-DD format (e.g. 2026-05-30)"
          }
        },
        "required": [
          "date"
        ]
      },
      "annotations": {
        "title": "Get Debrief",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "summary": {
            "type": "string"
          },
          "themes": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "highlights": {
            "type": "array",
            "items": {}
          },
          "new_threats": {
            "type": "integer"
          },
          "new_detections": {
            "type": "integer"
          },
          "threats": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "stats": {
            "type": "object",
            "properties": {
              "new_threats": {
                "type": "integer"
              },
              "total_threats_in_debrief": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "export_stix",
      "title": "Export STIX 2.1 Bundle",
      "description": "Export a threat, actor, or CVE as a STIX 2.1 bundle for ingestion into a TIP/SIEM. Provide at least one of threat_id, actor, or cve_id. Returns a {type:\"bundle\", objects:[...]} with indicator (per IOC), attack-pattern (per MITRE technique), intrusion-set (actor), vulnerability (CVE), malware/threat-actor, and relationship objects. Set include_osint=true to add `sighting` SROs for indicators the community independently reported (TL_OSINT_Scan / tweetfeed.live, CC0) — community-sourced and heavily concentrated, so they carry x_threadlinqs_trust=\"community-unverified\". The bundle is capped (≤200 objects / ≤80KB); a note object is appended if truncated.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID to export (e.g. TL-2026-0042)"
          },
          "actor": {
            "type": "string",
            "description": "Threat-actor name or alias to export (e.g. \"APT29\")"
          },
          "cve_id": {
            "type": "string",
            "description": "CVE identifier to export (e.g. CVE-2024-3400)"
          },
          "include_osint": {
            "type": "boolean",
            "description": "Add community `sighting` objects for corroborated indicators (default false)"
          }
        }
      },
      "annotations": {
        "title": "Export STIX 2.1 Bundle",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Always 'bundle'."
          },
          "id": {
            "type": "string"
          },
          "objects": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "type",
          "objects"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "export_attack_navigator",
      "title": "Export ATT&CK Navigator Layer",
      "description": "Export a MITRE ATT&CK Navigator layer (enterprise-attack) for visualization. Pass actor=<name> to score techniques attributed to one actor, or all=true for platform-wide coverage. score is PER TECHNIQUE — the number of corpus threats using it (for the actor, or platform-wide) — so the heatmap ranks within a tactic, not just between tactics; the unit is stated in the layer's description and metadata. Returns {name, versions, domain, description, techniques:[{techniqueID, score, color, comment}], gradient, metadata}. Capped at 600 techniques; when the tail is dropped, metadata carries a 'truncated' entry saying so. ATLAS (AML.*) and non-enterprise ids are excluded, since the layer domain is enterprise-attack.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "actor": {
            "type": "string",
            "description": "Threat-actor name or alias whose techniques to score (e.g. \"APT29\")"
          },
          "all": {
            "type": "boolean",
            "description": "If true, build a platform-wide coverage layer from MITRE coverage instead of a single actor"
          }
        }
      },
      "annotations": {
        "title": "Export ATT&CK Navigator Layer",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "domain": {
            "type": "string"
          },
          "versions": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "description": {
            "type": "string",
            "description": "Includes the scoring unit (\"Score = …\")."
          },
          "techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "techniqueID": {
                  "type": "string"
                },
                "score": {
                  "type": "number",
                  "description": "Threats using THIS technique (per-technique, not per-tactic). See description/metadata for the unit."
                },
                "comment": {
                  "type": "string"
                },
                "color": {
                  "type": "string"
                },
                "enabled": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "gradient": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "metadata": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "value": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "techniques"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "list_threat_categories",
      "title": "List Threat Categories",
      "description": "List every threat category with its threat count across the whole corpus. Use to discover valid category filters for search_threats.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "List Threat Categories",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "category": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "total_categories": {
            "type": "integer"
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "search_detections",
      "title": "Search Detections",
      "description": "Keyword search across detection logic (SPL/KQL/Sigma) by rule text, technique, or threat. Optionally filter by type (spl|kql|sigma) or severity. Paginated via limit (default 25, max 200) + offset.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search term (rule text, CVE, technique, etc.)"
          },
          "type": {
            "type": "string",
            "description": "Detection type: spl, kql, or sigma"
          },
          "severity": {
            "type": "string",
            "description": "Filter by severity: critical, high, medium, low"
          },
          "limit": {
            "type": "number",
            "description": "Max results (default 25, max 200)"
          },
          "offset": {
            "type": "number",
            "description": "Row offset for pagination (default 0)"
          }
        },
        "required": [
          "query"
        ]
      },
      "annotations": {
        "title": "Search Detections",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Detection ID — pass to get_detection_detail / export_detection."
                },
                "name": {
                  "type": "string"
                },
                "detection_type": {
                  "type": "string",
                  "description": "spl | kql | sigma"
                },
                "severity": {
                  "type": "string"
                },
                "threat_id": {
                  "type": "string",
                  "description": "Owning threat — pass to get_threat."
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_detection_detail",
      "title": "Get Detection Detail",
      "description": "Get the full detail for one detection rule by its ID, including the complete query text (SPL/KQL/Sigma), metadata, and the threat it maps to.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "detection_id": {
            "type": "string",
            "description": "Detection ID"
          }
        },
        "required": [
          "detection_id"
        ]
      },
      "annotations": {
        "title": "Get Detection Detail",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "threat_id": {
            "type": "string",
            "description": "Pass to get_threat."
          },
          "name": {
            "type": "string"
          },
          "detection_type": {
            "type": "string"
          },
          "severity": {
            "type": "string"
          },
          "query": {
            "type": [
              "string",
              "null"
            ]
          },
          "kql_query": {
            "type": [
              "string",
              "null"
            ]
          },
          "sigma_rule": {
            "type": [
              "string",
              "null"
            ]
          },
          "mitre_mapping": {
            "type": "array",
            "items": {}
          },
          "false_positives": {
            "type": "array",
            "items": {}
          },
          "threat_title": {
            "type": "string"
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/detection",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "list_simulations",
      "title": "List Simulations",
      "description": "DEPRECATED (generation stopped 2026-08-03; archived rows only). List adversary-emulation simulation scenarios across the platform (atomic test commands grouped by threat). `total` / `total_simulations` are CORPUS-wide; the page you got is `returned` / `page_simulations`, and `has_more` + `next_offset` walk the rest. The `correlation` block (shared_techniques, attack_chain_similarities, platform/tactic coverage) is computed over the RETURNED PAGE only — it carries scope:\"page\" and changes with limit. Pass limit (default 50, max 200) and offset. include_facets=true adds the corpus filter vocabulary (~20 KB of actor/nation/category strings) — off by default. Prefer get_flow_coverage and get_attack_flow — ATT&CK Flows replaced simulations.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "description": "Max threats in this page (default 50, max 200)"
          },
          "offset": {
            "type": "number",
            "description": "Row offset for paging (default 0). Use next_offset from the previous response."
          },
          "include_facets": {
            "type": "boolean",
            "description": "Include the corpus filter vocabulary (filter_meta). Default false — it is ~20 KB and does not shrink with limit."
          }
        }
      },
      "annotations": {
        "title": "List Simulations",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threats": {
            "type": "array",
            "items": {}
          },
          "returned": {
            "type": "integer",
            "description": "Threats in THIS page."
          },
          "total": {
            "type": "integer",
            "description": "Corpus-wide threats that have simulations."
          },
          "total_simulations": {
            "type": "integer",
            "description": "Corpus-wide simulation rows."
          },
          "page_simulations": {
            "type": "integer",
            "description": "Simulation rows across the returned page only."
          },
          "has_more": {
            "type": "boolean"
          },
          "next_offset": {
            "type": [
              "integer",
              "null"
            ]
          },
          "deprecated": {
            "type": "boolean"
          },
          "generation_stopped": {
            "type": "string"
          },
          "filter_meta": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "correlation": {
            "type": "object",
            "properties": {
              "scope": {
                "type": "string"
              },
              "computed_over_threats": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_threat_transcripts",
      "title": "Get Threat Transcripts",
      "description": "Get the PIPELINE PROVENANCE record for a threat — how its profile was produced, not analysis of the threat itself. Returns the 7 pipeline phases (HUNT/RESEARCH/SIMULATION/DETECT/PUBLISH/CORRELATION/TRANSCRIPT) with per-phase timing, the quality gates and their PASS/FAIL metrics (tag/technique/IOC/reference counts), an overall quality score, the inter-agent handoff log, and correlation_highlights (related threat ids and the high-frequency IOCs that linked them). The handoff messages are routing stubs and file pointers, NOT analyst prose — do not expect written reasoning about the adversary. Use this to judge how thoroughly a threat was worked and to find its related-threat/IOC leads; use get_threat or get_threat_enrichment for the analysis, and get_attribution_evidence for why it is attributed.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Get Threat Transcripts",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "transcripts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "generated_by": {
                  "type": "string"
                },
                "score": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "Pipeline quality score."
                },
                "phases": {
                  "type": "array",
                  "items": {}
                },
                "signals": {
                  "type": "array",
                  "items": {}
                },
                "messages": {
                  "type": "array",
                  "items": {}
                },
                "summary": {
                  "type": "object",
                  "properties": {},
                  "additionalProperties": true
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "integer"
          }
        },
        "required": [
          "threat_id"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_mitre_gap_analysis",
      "title": "MITRE Gap Analysis",
      "description": "Prioritized list of MITRE ATT&CK techniques with the weakest detection coverage (detection debt), ranked by debt_score = attributed threats / (1 + detection rules mapping the technique or its parent), scaled by exploitability (max EPSS / KEV of the CVEs its threats weaponize) and rarity. Higher = more exposure with less rule coverage. Filter by tactic (spelling-insensitive: \"execution\", \"Execution\" and \"Execution (ICS)\" all match) and cap with limit; summary.gaps/coverage_pct describe the FILTERED corpus, not the returned page.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tactic": {
            "type": "string",
            "description": "Filter to one ATT&CK tactic (e.g. \"execution\", \"defense-evasion\", \"command-and-control\"). An unmatched value returns summary.available_tactics."
          },
          "limit": {
            "type": "number",
            "description": "Max techniques (default 20, max 100). Rows come back debt_score-descending, so limit=N is the top-N worst."
          }
        }
      },
      "annotations": {
        "title": "MITRE Gap Analysis",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string",
                  "description": "Pass to get_mitre_technique."
                },
                "technique_name": {
                  "type": "string"
                },
                "debt_score": {
                  "type": "number",
                  "description": "Ranking unit. Higher = weaker coverage against more exposure; see summary.scoring."
                },
                "priority_label": {
                  "type": "string",
                  "description": "critical | high | medium | low, banded off debt_score."
                },
                "is_covered": {
                  "type": "boolean",
                  "description": "True when at least one detection maps this technique (or its parent) in detections.mitre_mapping."
                },
                "detection_count": {
                  "type": "integer",
                  "description": "Rules mapping this technique or its parent — NOT detections on threats that merely share it."
                },
                "threat_exposure": {
                  "type": "integer"
                },
                "epss_max": {
                  "type": "number"
                },
                "kev_exposure": {
                  "type": "integer"
                },
                "tactic": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "summary": {
            "type": "object",
            "properties": {
              "total": {
                "type": "integer",
                "description": "Techniques matching the tactic filter (the ranking denominator), not the page size."
              },
              "returned": {
                "type": "integer"
              },
              "has_more": {
                "type": "boolean"
              },
              "covered": {
                "type": "integer"
              },
              "gaps": {
                "type": "integer"
              },
              "coverage_pct": {
                "type": "number"
              },
              "by_priority": {
                "type": "object",
                "properties": {},
                "additionalProperties": true
              },
              "by_tactic": {
                "type": "object",
                "properties": {},
                "additionalProperties": true
              },
              "tactic_filter": {
                "type": [
                  "string",
                  "null"
                ]
              },
              "corpus_total": {
                "type": "integer"
              },
              "available_tactics": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "scoring": {
                "type": "string",
                "description": "States what debt_score counts."
              }
            },
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/mitre-matrix",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_enrichment_overview",
      "title": "Enrichment Overview",
      "description": "Health and coverage of the enrichment LANES feeding the platform, one row each: cve_details, threat_iocs, detections, mitre_attack, c2_intel, dns_enrichment, tl_osint_scan, osint_blocklist_liveness. EPSS and KEV are NOT separate lanes - they are fields inside cve_details (whose hit_rate is the share of CVEs carrying both CVSS v3 and EPSS), and there is no IOC-reputation lane; the nearest signals are osint_blocklist_liveness and tl_osint_scan. Each lane's hit_rate has its OWN definition (they are not comparable to each other) and coverage_basis distinguishes 'measured_zero' from 'not_measured' - c2_intel really is 0% corpus coverage, because c2_correlations_v2 has no populated threat_id. This is a nightly snapshot: read as_of/stale_hours before treating it as current.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Enrichment Overview",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "sources": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "source": {
                  "type": "string",
                  "description": "Lane name (alias of source_name)."
                },
                "source_name": {
                  "type": "string"
                },
                "total_events": {
                  "type": "integer"
                },
                "unique_entities": {
                  "type": "integer"
                },
                "hit_rate": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "PER-LANE definition, not comparable across lanes. NULL = not measurable for this lane."
                },
                "coverage_pct": {
                  "type": [
                    "number",
                    "null"
                  ],
                  "description": "Share of the corpus this lane reaches. Read WITH coverage_basis."
                },
                "coverage_basis": {
                  "type": "string",
                  "description": "'measured' | 'measured_zero' (really zero) | 'not_measured' (never computed) - the two used to be indistinguishable."
                },
                "hit_rate_basis": {
                  "type": "string",
                  "description": "'measured' | 'not_measured'."
                },
                "avg_enrichment_fields": {
                  "type": [
                    "number",
                    "null"
                  ]
                },
                "last_event_time": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "provenance": {
                  "type": "string",
                  "description": "'native_d1' = computed from our own tables; 'harness_tl_osint_scan' = community-sourced, corroborating only."
                },
                "updated_at": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "as_of": {
            "type": [
              "string",
              "null"
            ],
            "description": "Newest row timestamp - this is a nightly snapshot, not a live read."
          },
          "stale_hours": {
            "type": [
              "integer",
              "null"
            ]
          },
          "summary": {
            "type": "object",
            "properties": {
              "total_sources": {
                "type": "integer"
              },
              "total_events": {
                "type": "integer"
              },
              "avg_hit_rate": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "Averaged ONLY over lanes reporting a real hit_rate."
              },
              "measured_zero_coverage": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "unmeasured_coverage": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            },
            "additionalProperties": true
          },
          "note": {
            "type": "string",
            "description": "States which advertised sources are lanes and which are fields of a lane."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_roadmap",
      "title": "Get Roadmap",
      "description": "Get the Threadlinqs Intelligence platform roadmap: `completed`, `in_progress` and `ideas` (planned), with `counts`, `generated_at` and `as_of`. WARNING: this table is hand-maintained and has not been updated since Feb 2026 — the response carries stale_days and a warning, and several items still marked \"planned\" have since shipped. Do not report an item as unbuilt on this basis; confirm with get_started (live tool catalog), get_platform_stats or get_engine_status.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Get Roadmap",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "ideas": {
            "type": "array",
            "items": {}
          },
          "in_progress": {
            "type": "array",
            "items": {}
          },
          "completed": {
            "type": "array",
            "items": {}
          },
          "counts": {
            "type": "object",
            "properties": {
              "ideas": {
                "type": "integer"
              },
              "in_progress": {
                "type": "integer"
              },
              "completed": {
                "type": "integer"
              },
              "total": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "generated_at": {
            "type": "string",
            "description": "When this response was produced."
          },
          "as_of": {
            "type": [
              "string",
              "null"
            ],
            "description": "Last date the roadmap table itself was edited."
          },
          "stale_days": {
            "type": [
              "integer",
              "null"
            ]
          },
          "stale": {
            "type": "boolean"
          },
          "warning": {
            "type": "string",
            "description": "Present when stale; says the statuses are unreconciled."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_changelog",
      "title": "Get Changelog",
      "description": "Get the platform changelog (new threats, detections, features), strictly newest-first by date. Pass limit (default 20, max 100). NOTE: this is a hand-maintained release feed, not a deploy log — it stopped being written in Feb 2026, so the response carries latest_entry_date / stale_days / a warning. For what the platform actually looks like NOW use get_platform_stats (live corpus counts) and get_engine_status (pipeline state); do not answer \"what changed recently\" from this alone.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "description": "Max entries (default 20, max 100)"
          }
        }
      },
      "annotations": {
        "title": "Get Changelog",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "entries": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {},
                "version": {
                  "type": "string"
                },
                "date": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "changes": {
                  "type": "array",
                  "items": {}
                }
              },
              "additionalProperties": true
            }
          },
          "count": {
            "type": "integer"
          },
          "total": {
            "type": [
              "integer",
              "null"
            ]
          },
          "has_more": {
            "type": "boolean"
          },
          "latest_entry_date": {
            "type": [
              "string",
              "null"
            ],
            "description": "Date of the newest entry — the feed cut-off."
          },
          "stale_days": {
            "type": [
              "integer",
              "null"
            ]
          },
          "stale": {
            "type": "boolean"
          },
          "warning": {
            "type": "string",
            "description": "Present when the feed is stale; says what it does NOT cover."
          }
        },
        "required": [
          "entries"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "export_detection",
      "title": "Export Detection",
      "description": "Export one detection rule in a specific format. format=spl|kql|sigma returns the raw query text for that flavor; format=json returns the full detection object.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "detection_id": {
            "type": "string",
            "description": "Detection ID"
          },
          "format": {
            "type": "string",
            "description": "spl, kql, sigma, or json"
          }
        },
        "required": [
          "detection_id",
          "format"
        ]
      },
      "annotations": {
        "title": "Export Detection",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "detection_id": {
            "type": "string"
          },
          "format": {
            "type": "string"
          },
          "content": {
            "type": [
              "string",
              "null"
            ],
            "description": "Rule text for spl/kql/sigma. For format=json the detection object is returned directly instead."
          },
          "available": {
            "type": "boolean"
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_latest_debrief",
      "title": "Get Latest Debrief",
      "description": "Get the most recent daily intelligence debrief in full detail (resolves the latest date for you).",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Get Latest Debrief",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "summary": {
            "type": "string"
          },
          "latest": {
            "type": [
              "object",
              "null"
            ]
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_threat_bundle",
      "title": "Get Threat Bundle",
      "description": "One-shot dossier for a threat: threat detail plus its simulations and pipeline transcripts (include=\"summary\" returns just the threat). Fewer round-trips than get_threat + get_threat_simulations + get_threat_transcripts separately. The threat is the same bounded projection get_threat returns by default — call get_threat(id, sections=\"all\") for the unabridged record.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          },
          "include": {
            "type": "string",
            "description": "\"full\" (default) bundles simulations + transcripts; \"summary\" returns just the threat"
          },
          "simulation_limit": {
            "type": "integer",
            "description": "Playbooks to embed, 1-20 (default 3). Each carries full command text; raise only if you need more than the newest few."
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Get Threat Bundle",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "simulations": {
            "type": [
              "object",
              "null"
            ]
          },
          "transcripts": {
            "type": [
              "object",
              "null"
            ],
            "description": "Omitted entirely when include='summary'."
          }
        },
        "required": [
          "threat"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/threat",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_threat_hunting_bundle",
      "title": "Threat Hunting Bundle",
      "description": "Flagship one-call hunting dossier for a threat: threat detail + similar threats + simulations + infrastructure pivots, composed server-side. Best single tool to scope a hunt around one threat. Every section is bounded so the bundle fits in one response — raise simulation_limit / pivot_limit, or call get_infrastructure_pivots and get_threat directly, when you need the full lists.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0042)"
          },
          "simulation_limit": {
            "type": "integer",
            "description": "Playbooks to embed, 1-20 (default 3)."
          },
          "pivot_limit": {
            "type": "integer",
            "description": "Infrastructure pivots to embed, 1-200 (default 25). One threat can carry 150+; get_infrastructure_pivots returns the full set."
          },
          "shape": {
            "type": "string",
            "description": "\"v1\" (default, unchanged nested envelope) | \"canonical\" (flat, stably-named, SMALLER — recommended for programmatic consumers) | \"both\". In canonical: technique ids are a top-level `ttps` array, sectors/regions use ONE spelling, and every array key is ALWAYS an array (never null, never an object). In v1, `similar_threats` and `infrastructure_pivots` are handler envelopes (objects) while `threat.similar_threats` is a flat array — if you are writing a parser, use canonical."
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Threat Hunting Bundle",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "similar_threats": {
            "type": [
              "object",
              "null"
            ],
            "description": "v1: handler envelope {source_threat_id, count, similar[]} — an OBJECT, not an array."
          },
          "simulations": {
            "type": [
              "object",
              "null"
            ]
          },
          "infrastructure_pivots": {
            "type": [
              "object",
              "null"
            ],
            "description": "v1: handler envelope {threat_id, infrastructure_pivots[], coverage{}} — an OBJECT."
          },
          "ttps": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Canonical MITRE technique ids, present in BOTH shapes."
          },
          "_envelope": {
            "type": "object",
            "description": "Shape manifest — announces that shape=\"canonical\" exists."
          },
          "canonical": {
            "type": "object",
            "description": "Present only under shape=\"both\"."
          },
          "threat_id": {
            "type": "string"
          },
          "ttp_details": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "tactic": {
                  "type": [
                    "string",
                    "null"
                  ]
                }
              },
              "additionalProperties": true
            }
          },
          "sectors": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "regions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "iocs": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "category": {
                  "type": "string"
                },
                "type": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "value": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            },
            "description": "canonical: FLAT array. (In v1 this is an object keyed by category under threat.iocs.)"
          },
          "counts": {
            "type": "object",
            "description": "canonical: a denominator for every array key."
          },
          "_shape": {
            "type": "object"
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/threat",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_daily_intel_bundle",
      "title": "Daily Intel Bundle",
      "description": "One-shot \"what happened\" bundle: the day's debrief (latest by default, or pass date) plus platform stats, the top recent threats as LEAN summary rows, and the correlations overview. Drill into any listed threat with get_threat(id).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "description": "Debrief date YYYY-MM-DD (default: latest)"
          },
          "top_n": {
            "type": "number",
            "description": "How many top threats to include (default 5, max 10)"
          }
        }
      },
      "annotations": {
        "title": "Daily Intel Bundle",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "debrief": {
            "type": [
              "object",
              "null"
            ]
          },
          "platform_stats": {
            "type": [
              "object",
              "null"
            ]
          },
          "top_threats": {
            "type": [
              "object",
              "null"
            ],
            "description": "LEAN summary rows (the search_threats shape) — call get_threat(id) for a dossier."
          },
          "correlations_overview": {
            "type": [
              "object",
              "null"
            ]
          },
          "detail_hint": {
            "type": "string"
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "bulk_get_threats",
      "title": "Bulk Get Threats",
      "description": "Fetch up to 20 threats by ID in one call. Returns LEAN rows by default (identity, severity, attribution, CVEs, targets + `counts` for MITRE/IOCs/detections/timeline/tags), which is what makes 20 ids actually fit in one response. `count` is the number of rows actually present in threats[]; unresolvable ids come back in `missing`. detail=\"full\" returns whole dossiers but is capped at 3 ids per call (a full dossier is ~68 KB) — the overflow is named in `deferred_ids`, never silently dropped. Drill into any row with get_threat(id).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_ids": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Threat IDs (max 20)"
          },
          "detail": {
            "type": "string",
            "description": "\"summary\" (default, all 20 fit) | \"full\" (whole dossiers, max 3 ids per call)"
          }
        },
        "required": [
          "threat_ids"
        ]
      },
      "annotations": {
        "title": "Bulk Get Threats",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "missing": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Requested ids that were not found."
            }
          },
          "count": {
            "type": "integer",
            "description": "Rows actually present in threats[] — safe to iterate on."
          },
          "requested": {
            "type": "integer",
            "description": "How many ids the caller supplied."
          },
          "detail": {
            "type": "string",
            "description": "\"summary\" | \"full\" — which row shape threats[] carries."
          },
          "deferred_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Ids NOT fetched because detail=\"full\" is batch-capped. Call again with these."
            }
          },
          "deferred_reason": {
            "type": "string"
          },
          "detail_hint": {
            "type": "string"
          }
        },
        "required": [
          "threats",
          "missing",
          "count"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "bulk_get_cves",
      "title": "Bulk Get CVEs",
      "description": "Fetch up to 20 enriched CVEs by ID in one call. Returns {cves, missing, count}.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cve_ids": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "CVE IDs (max 20)"
          }
        },
        "required": [
          "cve_ids"
        ]
      },
      "annotations": {
        "title": "Bulk Get CVEs",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "cves": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "cve_id": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "missing": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "count": {
            "type": "integer"
          }
        },
        "required": [
          "cves",
          "missing"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_actor_intelligence",
      "title": "Actor Intelligence",
      "description": "Composite intelligence picture for a threat actor: the actor profile (threats, MITRE, IOC counts, CVEs, tooling, targets), the known actor_relationships baseline, plus cross-actor attribution SCOPED TO THIS ACTOR — only shared entities whose actor list names it or one of its aliases, ranked by attribution belief (shared malware/infrastructure outranks commodity TTPs). Use it to answer \"who else does this actor overlap with, and on what evidence\".",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Threat-actor name or alias (e.g. \"APT29\")"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "title": "Actor Intelligence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "actor": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {}
          },
          "mitre": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "cves": {
            "type": "array",
            "items": {}
          },
          "tools": {
            "type": "array",
            "items": {}
          },
          "actor_relationships": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "related_name": {
                  "type": "string"
                },
                "rel_type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "cross_actor_attribution": {
            "type": "object",
            "properties": {
              "scoped_to": {
                "type": "string",
                "description": "The queried actor. Rows below name ONLY this actor or an alias — never the whole corpus."
              },
              "shared_entities": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "entity_type": {
                      "type": "string"
                    },
                    "entity_value": {
                      "type": "string"
                    },
                    "belief": {
                      "type": "number"
                    },
                    "belief_label": {
                      "type": "string",
                      "description": "strong | moderate | weak | commodity — commodity is weak attribution signal."
                    },
                    "actor_list": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "actor_count": {
                      "type": "integer",
                      "description": "True co-actor count; actor_list is clipped."
                    },
                    "threat_ids": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "threat_count": {
                      "type": "integer"
                    },
                    "evidence": {
                      "type": "array",
                      "items": {}
                    }
                  },
                  "additionalProperties": true
                }
              },
              "counts": {
                "type": "object",
                "properties": {
                  "matched": {
                    "type": "integer"
                  },
                  "returned": {
                    "type": "integer"
                  },
                  "truncated": {
                    "type": "boolean"
                  },
                  "by_belief": {
                    "type": "object",
                    "properties": {},
                    "additionalProperties": true
                  },
                  "by_type": {
                    "type": "object",
                    "properties": {},
                    "additionalProperties": true
                  },
                  "co_actor_count": {
                    "type": "integer",
                    "description": "Every actor touched by ANY matched row, commodity TTPs included — a breadth number, not an answer."
                  },
                  "co_actors_returned": {
                    "type": "integer"
                  }
                },
                "additionalProperties": true
              },
              "co_actors": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "actor": {
                      "type": "string",
                      "description": "Pass to get_actor / get_actor_intelligence."
                    },
                    "shared_entities": {
                      "type": "integer"
                    },
                    "max_belief": {
                      "type": "number"
                    },
                    "strongest": {
                      "type": "object",
                      "properties": {
                        "entity_type": {
                          "type": "string"
                        },
                        "entity_value": {
                          "type": "string"
                        },
                        "belief_label": {
                          "type": "string"
                        }
                      },
                      "additionalProperties": true
                    },
                    "by_type": {
                      "type": "object",
                      "properties": {},
                      "additionalProperties": true
                    }
                  },
                  "additionalProperties": true
                }
              },
              "corpus": {
                "type": "object",
                "properties": {
                  "total_shared": {
                    "type": "integer"
                  },
                  "unique_actors": {
                    "type": "integer"
                  }
                },
                "additionalProperties": true
              }
            },
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/actor",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_cve_intelligence",
      "title": "CVE Intelligence",
      "description": "Composite CVE dossier in one call: the enriched CVE detail, the threats that reference it (authoritative join — cve.threat_ids is reconciled to it), the attributed actors and MITRE techniques behind those threats, weaponization velocity for THIS CVE with its rank against the corpus, CWE-sibling related CVEs, and detections that name it.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cve_id": {
            "type": "string",
            "description": "CVE identifier (e.g. CVE-2024-3400)"
          }
        },
        "required": [
          "cve_id"
        ]
      },
      "annotations": {
        "title": "CVE Intelligence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "cve": {
            "type": "object",
            "properties": {
              "cve_id": {
                "type": "string"
              },
              "threat_ids": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "Reconciled from threats.cve_list — the authoritative join. Pass to get_threat."
                }
              },
              "threat_ids_source": {
                "type": "string"
              },
              "threat_ids_note": {
                "type": "string",
                "description": "Present only when the derived cve_details reverse index disagreed."
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "title": {
                  "type": "string"
                },
                "severity": {
                  "type": "string"
                },
                "actor": {
                  "type": [
                    "string",
                    "null"
                  ]
                }
              },
              "additionalProperties": true
            }
          },
          "actors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "actor": {
                  "type": "string"
                },
                "threat_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "mitre": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_id": {
                  "type": "string"
                },
                "technique": {
                  "type": "string"
                },
                "tactic": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "related_cves": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "cve_id": {
                  "type": "string"
                },
                "is_kev": {
                  "type": "boolean"
                }
              },
              "additionalProperties": true
            }
          },
          "velocity_data": {
            "type": "object",
            "properties": {
              "cve": {
                "type": [
                  "object",
                  "null"
                ],
                "description": "The velocity row for THIS CVE (velocity_days = publication → first tracked threat), or null when it has no tracked linkage."
              },
              "rank": {
                "type": [
                  "object",
                  "null"
                ],
                "description": "{faster_than_pct, position, of} — where this CVE sits in the corpus velocity distribution."
              },
              "cohort_fastest": {
                "type": "array",
                "items": {}
              },
              "corpus": {
                "type": "object",
                "properties": {
                  "total": {
                    "type": "integer"
                  },
                  "avg_velocity": {
                    "type": "number"
                  }
                },
                "additionalProperties": true
              },
              "note": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "related_detections": {
            "type": [
              "object",
              "null"
            ]
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "health",
      "title": "Health Check",
      "description": "Lightweight liveness probe: confirms the API is reachable and your key is valid, and returns platform counts + the latest debrief date.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Health Check",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "description": "'ok' | 'degraded'"
          },
          "api_reachable": {
            "type": "boolean"
          },
          "platform_stats": {
            "type": [
              "object",
              "null"
            ]
          },
          "latest_debrief_date": {
            "type": [
              "string",
              "null"
            ]
          },
          "server_version": {
            "type": "string"
          },
          "wire_version": {
            "type": "string",
            "description": "Negotiated MCP protocol version."
          },
          "tool_count": {
            "type": "integer",
            "description": "Tools the LIVE server exposes. If your client listed fewer, its catalog is stale."
          },
          "prompt_count": {
            "type": "integer"
          },
          "catalog_source": {
            "type": "string",
            "description": "Always 'live' here — this response came from the server, not a cached catalog."
          },
          "min_recommended_client": {
            "type": "string"
          },
          "catalog_hint": {
            "type": "string"
          }
        },
        "required": [
          "status"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "hunt",
      "title": "Hunt (TLQL)",
      "description": "Run a deterministic SIEM-style query over the pre-joined observation index (~106k rows across tool, malware, ioc, mitre, cve, attribution, dns and infra observations). Use this INSTEAD of chaining many search_threats calls when the question is an aggregate (\"how many X grouped by Y\") or crosses observation types (\"threats using tool A that also have IOC type B\"). Append \"| stats count by <field>\" to aggregate; without it you get matching rows. A threat contributes one row per observation, so for \"how many THREATS\" use \"| stats count_distinct(threat) by <field>\" — plain count double-counts. Operators are = != > < >= <= LIKE CONTAINS IN \"NOT IN\"; quote any value with a hyphen (cve = \"CVE-2024-3400\"). Call hunt_schema first if you do not know the field names.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "TLQL, e.g. `tool = \"cobalt strike\" AND sector = \"healthcare\" | stats count by nation`"
          },
          "limit": {
            "type": "integer",
            "description": "Row cap for non-stats queries (default 50, max 100). In stats mode it caps the number of GROUPS returned. Check `has_more` in the response."
          }
        },
        "required": [
          "query"
        ]
      },
      "annotations": {
        "title": "Hunt (TLQL)",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string"
          },
          "mode": {
            "type": "string",
            "description": "'stats' when the query has a | stats pipe, otherwise rows."
          },
          "tier_gated_included": {
            "type": "boolean",
            "description": "True when the caller's tier allows the c2_beacon/dns/infra observation types."
          },
          "by": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "func": {
            "type": "string"
          },
          "groups": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "limit": {
            "type": "integer"
          },
          "has_more": {
            "type": "boolean",
            "description": "True when rows (or, in stats mode, groups) were cut at the limit."
          },
          "columns": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "count": {
            "type": "integer",
            "description": "Rows RETURNED, not rows matched."
          },
          "rows": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "obs_type": {
                  "type": "string"
                },
                "threat_id": {
                  "type": "string",
                  "description": "Pass to get_threat."
                },
                "actor": {
                  "type": "string"
                },
                "tool": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "ioc_type": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "ioc_value": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "cve": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "mitre_technique": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "severity": {
                  "type": "string"
                },
                "category": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "query",
          "mode"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/hunt",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "hunt_schema",
      "title": "Hunt Schema",
      "description": "The hunt query grammar: every filterable field and alias, which fields are scoped observables vs denormalized, the operators, the stats-pipe form, worked examples, and how fresh the index is. Call once before writing a hunt query.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Hunt Schema",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "rebuilt_at": {
            "type": [
              "string",
              "null"
            ]
          },
          "row_count": {
            "type": "integer"
          },
          "duration_ms": {
            "type": "integer"
          },
          "by_type_json": {
            "type": "string",
            "description": "JSON string of per-observation-type row counts."
          },
          "grammar": {
            "type": "object",
            "properties": {
              "fields": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "column": {
                      "type": "string"
                    },
                    "scope": {
                      "type": "boolean",
                      "description": "Scoped observable — filtering it means \"threats that HAVE this\", so it can be crossed with a group-by on a different observation type."
                    },
                    "multi": {
                      "type": "boolean"
                    },
                    "case_insensitive": {
                      "type": "boolean"
                    },
                    "time": {
                      "type": "boolean"
                    }
                  },
                  "additionalProperties": true
                }
              },
              "display_columns": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "operators": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "op": {
                      "type": "string"
                    },
                    "note": {
                      "type": "string"
                    }
                  },
                  "additionalProperties": true
                }
              },
              "combinators": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "quoting": {
                "type": "string",
                "description": "When a value must be quoted — read this before writing a CVE or relative-time filter."
              },
              "stats": {
                "type": "object",
                "properties": {
                  "form": {
                    "type": "string"
                  },
                  "functions": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": {
                          "type": "string"
                        },
                        "aliases": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        },
                        "note": {
                          "type": "string"
                        }
                      },
                      "additionalProperties": true
                    }
                  }
                },
                "additionalProperties": true
              },
              "examples": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "grammar"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_attribution_evidence",
      "title": "Attribution Evidence",
      "description": "Why a threat is attributed to an actor: the verdict, canonical actor, confidence, scope, the cited evidence chain, which signals fired, suspected alternatives and the analyst reasoning. Crucially it also reports `state` — whether this is a researched assessment or an unresearched intake stub — which threats.threat_actor alone cannot tell you.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string",
            "description": "Threat ID (e.g. TL-2026-0989)."
          }
        },
        "required": [
          "threat_id"
        ]
      },
      "annotations": {
        "title": "Attribution Evidence",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threat_id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "current_actor": {
            "type": "string"
          },
          "verdict": {
            "type": "string"
          },
          "actor": {
            "type": "string"
          },
          "actor_canonical": {
            "type": "string"
          },
          "actor_uuid": {
            "type": "string"
          },
          "confidence": {
            "type": "string"
          },
          "scope": {
            "type": "string"
          },
          "reason_code": {
            "type": [
              "string",
              "null"
            ]
          },
          "evidence": {
            "type": "array",
            "items": {}
          },
          "signals": {
            "type": "array",
            "items": {}
          },
          "suspected": {
            "type": "array",
            "items": {}
          },
          "reasoning": {
            "type": "string"
          },
          "method": {
            "type": "string"
          },
          "state": {
            "type": "string",
            "description": "'assessed' vs 'pending_research' — whether this is a real assessment or an unresearched intake stub. Do not present a stub as an assessment."
          },
          "attributed_at": {
            "type": "string"
          },
          "queued_at": {
            "type": "string"
          }
        },
        "required": [
          "threat_id",
          "state"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_attribution_coverage",
      "title": "Attribution Coverage",
      "description": "Corpus-level attribution honesty: how many threats are genuinely assessed vs merely actor-labelled at ingest vs uncovered, broken down by confidence, scope and reason code, plus the research backlog, contradictions, top actors and the research clock (last real assessment, not last nightly intake).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "actor": {
            "type": "string",
            "description": "Optional — scope the `recent` list to one actor."
          }
        }
      },
      "annotations": {
        "title": "Attribution Coverage",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "corpus": {
            "type": "object",
            "properties": {
              "total": {
                "type": "integer"
              },
              "attributed": {
                "type": "integer"
              },
              "unattributed": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "engine": {
            "type": "object",
            "properties": {
              "rows_total": {
                "type": "integer"
              },
              "assessed": {
                "type": "integer"
              },
              "pending_research": {
                "type": "integer"
              },
              "contradicted": {
                "type": "integer"
              },
              "uncovered": {
                "type": "integer"
              },
              "latest_assessment_at": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "The RESEARCH clock — deliberately distinct from the nightly intake, so a dead research lane cannot read as fresh."
              }
            },
            "additionalProperties": true
          },
          "by_confidence": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "by_scope": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "by_reason": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "top_actors": {
            "type": "array",
            "items": {}
          },
          "recent": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "threat_id": {
                  "type": "string"
                },
                "actor": {
                  "type": "string"
                },
                "confidence": {
                  "type": "string"
                },
                "scope": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "explain_correlation",
      "title": "Explain Correlation",
      "description": "Why two threats are linked: the per-channel similarity decomposition (techniques, IOCs, CVEs, products, CWEs, context), which channel dominates and by how much, the concrete shared artifacts, the signal count, and quality flags for high-confidence/low-evidence and stale links. Use when get_similar_threats gives a score and you need the evidence behind it. Pass the pair in either order. Returns 404 when the engine has no edge between them.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_a": {
            "type": "string",
            "description": "First threat ID."
          },
          "threat_b": {
            "type": "string",
            "description": "Second threat ID."
          }
        },
        "required": [
          "threat_a",
          "threat_b"
        ]
      },
      "annotations": {
        "title": "Explain Correlation",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "score_breakdown": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "dominance": {},
          "shared_techniques": {
            "type": "array",
            "items": {}
          },
          "shared_iocs": {
            "type": "array",
            "items": {}
          },
          "shared_cves": {
            "type": "array",
            "items": {}
          },
          "signal_count": {
            "type": "integer"
          },
          "is_high_conf_low_signal": {
            "type": "boolean"
          },
          "is_stale": {
            "type": "boolean"
          },
          "error": {
            "type": "string",
            "description": "Present with HTTP 404 when the engine has no edge between the pair."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_correlation_path",
      "title": "Correlation Path",
      "description": "Shortest evidence path between two threats across the similarity graph: the intermediate threats, each hop's dominant linking signal and shared artifacts, and the weakest-link strength of the whole path. Answers \"is this incident connected to that campaign, and through what\". Returns found:false with a reason (no edges vs different components) rather than an empty array.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "description": "Starting threat ID."
          },
          "to": {
            "type": "string",
            "description": "Target threat ID."
          },
          "max_hops": {
            "type": "integer",
            "description": "Search depth, 1-8 (default 6)."
          }
        },
        "required": [
          "from",
          "to"
        ]
      },
      "annotations": {
        "title": "Correlation Path",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string"
          },
          "to": {
            "type": "string"
          },
          "found": {
            "type": "boolean"
          },
          "reason": {
            "type": "string",
            "description": "Why no path exists (no similarity edges vs different components) when found is false."
          },
          "hops": {
            "type": "array",
            "items": {}
          },
          "path_strength": {
            "type": "number"
          }
        },
        "required": [
          "from",
          "to",
          "found"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_entity_profile",
      "title": "Entity Profile",
      "description": "One-call dossier for any node in the intelligence graph — threat, technique, actor, IOC or CVE. Returns its centrality/pivot rank, top graph neighbours with edge fidelity, and type-specific rollups (linked threats, techniques with risk scores, IOCs with consensus and rarity, campaigns, related CVEs). Best token-per-call ratio in the graph family: replaces five or six separate lookups. Neighbours on the NPMI edge types also carry raw pmi, co_occurrence_count and the marginals {c, df_actor, df_tech, N}. For technique and ioc nodes the response includes `rarity` — corpus_df (how many threats mention it) against corpus_n — which is what separates a distinctive shared technique from background noise; check `top_neighbors_truncated` and raise `limit` before concluding a neighbour is absent.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "node_type": {
            "type": "string",
            "enum": [
              "threat",
              "technique",
              "actor",
              "ioc",
              "cve"
            ]
          },
          "node_id": {
            "type": "string",
            "description": "The entity id/value (TL- id, T-number, actor name, IOC value, or CVE id)."
          },
          "limit": {
            "type": "integer",
            "description": "Neighbours in top_neighbors (default 20, max 100 over MCP). They are ordered by fidelity, so the rare low-fidelity edges are the ones a small limit drops."
          }
        },
        "required": [
          "node_type",
          "node_id"
        ]
      },
      "annotations": {
        "title": "Entity Profile",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "node": {
            "type": "object",
            "properties": {
              "node_id": {
                "type": "string"
              },
              "node_type": {
                "type": "string"
              },
              "title": {
                "type": "string"
              },
              "severity": {
                "type": "string"
              },
              "actor": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "top_neighbors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "id": {
                  "type": "string"
                },
                "edge_type": {
                  "type": "string"
                },
                "fidelity": {
                  "type": "number",
                  "description": "Rounded 0-100. Use pmi to separate edges that share a fidelity."
                },
                "pmi": {
                  "type": "number",
                  "description": "NPMI edge types only (actor_technique, technique_cooccurrence)."
                },
                "co_occurrence_count": {
                  "type": "integer"
                },
                "marginals": {
                  "type": "object",
                  "properties": {
                    "c": {
                      "type": "integer"
                    },
                    "df_actor": {
                      "type": "integer"
                    },
                    "df_tech": {
                      "type": "integer"
                    },
                    "N": {
                      "type": "integer"
                    }
                  },
                  "additionalProperties": true
                }
              },
              "additionalProperties": true
            }
          },
          "top_neighbors_limit": {
            "type": "integer"
          },
          "top_neighbors_truncated": {
            "type": "boolean",
            "description": "True when more neighbours exist than were returned — raise `limit`."
          },
          "rarity": {
            "type": "object",
            "properties": {
              "corpus_df": {
                "type": "integer",
                "description": "Threats mentioning this technique/IOC."
              },
              "corpus_n": {
                "type": "integer",
                "description": "Threats in the corpus."
              },
              "df_ratio": {
                "type": [
                  "number",
                  "null"
                ]
              },
              "source": {
                "type": "string",
                "description": "graph_tech_df | graph_ioc_df (published-gen, matches the stored pmi denominators) or live_count."
              },
              "live_df": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "threats": {
            "type": "array",
            "items": {}
          },
          "techniques": {
            "type": "array",
            "items": {}
          },
          "iocs": {
            "type": "array",
            "items": {}
          },
          "campaigns": {
            "type": "array",
            "items": {}
          },
          "cves": {
            "type": "array",
            "items": {}
          }
        },
        "required": [
          "node"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_pivotal_entities",
      "title": "Pivotal Entities",
      "description": "The hubs and bridges of the intelligence graph ranked by weighted degree and approximate betweenness — where a single detection buys the most coverage. NOTE: betweenness is an ego-bridge heuristic, not exact Brandes; the response says so in `note`. Do not present it as exact betweenness.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "node_type": {
            "type": "string",
            "enum": [
              "threat",
              "technique",
              "actor",
              "ioc",
              "cve"
            ]
          },
          "limit": {
            "type": "integer",
            "description": "Default 25, max 100."
          }
        }
      },
      "annotations": {
        "title": "Pivotal Entities",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "node_id": {
                  "type": "string"
                },
                "node_type": {
                  "type": "string"
                },
                "weighted_degree": {
                  "type": "number"
                },
                "betweenness_approx": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
          },
          "note": {
            "type": "string",
            "description": "States that betweenness is an ego-bridge approximation, not exact Brandes."
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_graph_campaigns",
      "title": "Graph Campaigns",
      "description": "Campaign clusters the engine assembled from the similarity graph (connected components + label propagation): label, cohesion, top actors/techniques/IOCs/nation-states, and per-member {title, created_at, category, threat_actor}. Each cluster carries duplicate_risk plus its evidence (distinct_member_dates, date_span_days, shared_title_tokens) — a similarity-derived cluster of one event documented several times looks identical to a real multi-event campaign until you read those. Distinct from get_campaign_intelligence (looks up a NAMED campaign from threat text) and from list_campaigns (the roster of named campaigns); this one reports clusters the engine derived itself.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Default 15, max 50."
          }
        }
      },
      "annotations": {
        "title": "Graph Campaigns",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "label": {
                  "type": "string"
                },
                "member_count": {
                  "type": "integer"
                },
                "cohesion": {
                  "type": "number"
                },
                "threat_ids": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "additionalProperties": true
            }
          },
          "summary": {
            "type": "object",
            "properties": {
              "total_campaigns": {
                "type": "integer"
              },
              "largest": {}
            },
            "additionalProperties": true
          }
        },
        "required": [
          "data"
        ],
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/graph",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "get_technique_rules",
      "title": "Technique Co-occurrence Rules",
      "description": "MITRE ATT&CK technique PAIRS mined from the corpus with support, confidence and lift — which techniques travel together far above chance. Each rule carries both technique ids AND their ATT&CK names (technique_a_name / technique_b_name), so a rule is readable without a follow-up lookup. Complements predict_mitre_transitions exactly: that answers sequence (what follows what), this answers co-occurrence (what appears alongside what). Rules come back lift-descending; `summary.total_rules` reports how many exist in total, so `has_more` tells you whether the tail was cut. Note minSupport 0.02 — a pair must appear in ~2% of threats to be mined at all, so rare-technique pairs are structurally absent rather than uncorrelated.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Default 50, max 100."
          }
        }
      },
      "annotations": {
        "title": "Technique Co-occurrence Rules",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "rules": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "technique_a": {
                  "type": "string",
                  "description": "Pass to get_mitre_technique."
                },
                "technique_b": {
                  "type": "string",
                  "description": "Pass to get_mitre_technique."
                },
                "technique_a_name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "ATT&CK name for technique_a (null if the catalog does not know the id)."
                },
                "technique_b_name": {
                  "type": [
                    "string",
                    "null"
                  ],
                  "description": "ATT&CK name for technique_b (null if the catalog does not know the id)."
                },
                "cooccurrence_count": {
                  "type": "integer"
                },
                "support": {
                  "type": "number"
                },
                "confidence_ab": {
                  "type": "number"
                },
                "confidence_ba": {
                  "type": "number"
                },
                "lift": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
          },
          "summary": {
            "type": "object",
            "properties": {
              "total": {
                "type": "integer",
                "description": "Rules on THIS page (legacy field — use total_rules for the corpus count)."
              },
              "total_rules": {
                "type": "integer"
              },
              "returned": {
                "type": "integer"
              },
              "has_more": {
                "type": "boolean"
              },
              "max_lift": {
                "type": "number"
              },
              "method": {
                "type": "string"
              }
            },
            "additionalProperties": true
          }
        },
        "required": [
          "rules"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_engine_status",
      "title": "Intelligence Engine Status",
      "description": "Is the intelligence pipeline healthy? Per-engine row counts, last-compute times and derived ok/stale/empty status; the nightly graph pipeline's staged progress, current stage and degraded flag; recent failures; and the latest held-out accuracy eval (AUC). Check this before reasoning over correlation output if freshness matters.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Intelligence Engine Status",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "engines": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "key": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                },
                "count": {
                  "type": "integer"
                },
                "last_computed": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "status": {
                  "type": "string",
                  "description": "ok | stale | empty"
                }
              },
              "additionalProperties": true
            }
          },
          "failures": {
            "type": "array",
            "items": {}
          },
          "graph_pipeline": {
            "type": "object",
            "properties": {
              "published_gen": {
                "type": "number"
              },
              "published_at": {
                "type": "string"
              },
              "stage": {
                "type": "string"
              },
              "progress_pct": {
                "type": "number"
              },
              "degraded": {
                "type": "boolean"
              }
            },
            "additionalProperties": true
          },
          "eval": {
            "type": "object",
            "properties": {
              "auc_v2": {
                "type": "number"
              },
              "n_pairs": {
                "type": "integer"
              },
              "computed_at": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "generated_at": {
            "type": "string"
          }
        },
        "required": [
          "engines"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_osint_trends",
      "title": "Community OSINT Trends",
      "description": "What the security community is surging on right now (tweetfeed.live, CC0), joined against our own corpus coverage: trending tags with movement, TLD distribution, novelty, top producers, daily volume — plus `corpus` (how much of our corpus the community corroborates) and `early_warning` (the lead-time distribution). The coverage-gap and lead-time read; the corpus join exists nowhere else. Keyed on community TAGS, not malware family (populated on <1% of upstream rows).",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "title": "Community OSINT Trends",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "generated_at": {
            "type": "string"
          },
          "totals": {
            "type": "object",
            "properties": {
              "today": {
                "type": "integer"
              },
              "week": {
                "type": "integer"
              },
              "month": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "movers": {
            "type": "object",
            "properties": {
              "tags": {
                "type": "array",
                "items": {}
              }
            },
            "additionalProperties": true
          },
          "tlds": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "novelty": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "producers": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "daily": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "corpus": {
            "type": "object",
            "properties": {
              "threats_total": {
                "type": "integer"
              },
              "scanned": {
                "type": "integer"
              },
              "corroborated": {
                "type": "integer"
              },
              "coverage_pct": {
                "type": "number"
              }
            },
            "additionalProperties": true
          },
          "early_warning": {
            "type": "object",
            "properties": {
              "within_7d": {
                "type": "integer"
              },
              "mean_lead_days": {
                "type": "number"
              },
              "interpretation": {
                "type": "string"
              }
            },
            "additionalProperties": true
          },
          "caveat": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_community_campaigns",
      "title": "Community Campaigns",
      "description": "Campaign clusters from the community OSINT layer (tweetfeed.live, CC0): cluster name, confidence, targeted brand, first/last seen, indicator count and types, tags and reporters. Cluster labels are UPSTREAM AI output, not Threadlinqs attribution — do not present them as our assessment. On an upstream proxy failure the response carries community_error rather than erroring; report \"community feed unavailable\", not \"no campaigns\".",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Default 15, max 50."
          }
        }
      },
      "annotations": {
        "title": "Community Campaigns",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "generated_at": {
            "type": "string"
          },
          "window": {
            "type": "string"
          },
          "campaigns": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": {
                  "type": "string"
                },
                "confidence": {},
                "brand": {
                  "type": "string"
                },
                "indicator_count": {
                  "type": "integer"
                }
              },
              "additionalProperties": true
            }
          },
          "community_error": {
            "type": [
              "string",
              "null"
            ],
            "description": "Set to 'upstream_unavailable' on a proxy failure — report the feed as unavailable, NOT as zero campaigns."
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_c2_dns_intel",
      "title": "C2 DNS Unmasking",
      "description": "Reverse-DNS unmasking of C2 beacon infrastructure: which domains ride on each beacon IP, infrastructure fidelity (dedicated / mixed / shared), compromised-host flags and sample domains. Answers \"what else lives on this C2 infrastructure\". Filter by fidelity to separate adversary-owned infrastructure from shared hosting.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "fidelity": {
            "type": "string",
            "enum": [
              "dedicated",
              "mixed",
              "shared"
            ]
          },
          "compromised": {
            "type": "boolean",
            "description": "Only hosts flagged as compromised rather than adversary-owned."
          },
          "limit": {
            "type": "integer",
            "description": "Default 40, max 100."
          }
        }
      },
      "annotations": {
        "title": "C2 DNS Unmasking",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "rows": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "beacon_ip": {
                  "type": "string"
                },
                "framework": {
                  "type": "string"
                },
                "country": {
                  "type": "string"
                },
                "asn_org": {
                  "type": "string"
                },
                "domain_count": {
                  "type": "integer"
                },
                "fidelity": {
                  "type": "string",
                  "description": "dedicated | mixed | shared"
                },
                "compromised_flag": {
                  "type": "integer"
                },
                "sample_domains": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "first_dns_seen": {
                  "type": "string"
                },
                "beacon_first_seen": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "stats": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "total": {
            "type": "integer"
          },
          "offset": {
            "type": "integer"
          }
        },
        "required": [
          "rows"
        ],
        "additionalProperties": true
      }
    },
    {
      "name": "get_correlation_subgraph",
      "title": "Correlation Subgraph",
      "description": "The N-hop neighbourhood around any graph node — nodes, edges, and each edge's fidelity — for incremental exploration of the correlation graph. Start at depth 1 and expand: a whole-corpus graph exceeds every response budget. For a pre-aggregated single-entity view prefer get_entity_profile, which is cheaper and usually what you want; use this when you need the actual edge topology. Edges of the NPMI types (actor_technique, technique_cooccurrence) also carry the raw pmi, co_occurrence_count and the marginals {c, df_actor, df_tech, N} the score was computed from — use those, not the rounded fidelity, to compare two edges.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "seed_type": {
            "type": "string",
            "enum": [
              "threat",
              "technique",
              "actor",
              "ioc",
              "cve"
            ]
          },
          "seed_id": {
            "type": "string",
            "description": "The entity id/value to expand from."
          },
          "depth": {
            "type": "integer",
            "description": "Hops, 1-3 (default 1). Each hop multiplies the node count."
          },
          "min_fidelity": {
            "type": "number",
            "description": "Drop edges below this fidelity. Scale is 0-100, NOT 0-1 — typical NPMI edges sit between 5 and 30, so 0.5 filters nothing."
          },
          "edge_type": {
            "type": "string",
            "enum": [
              "actor_technique",
              "technique_cooccurrence",
              "ioc_threat",
              "threat_similarity"
            ],
            "description": "Keep only edges of this type (also prunes the traversal, so it changes which nodes are reachable). Omit for all types."
          },
          "limit_nodes": {
            "type": "integer",
            "description": "Default 40, max 60 over MCP."
          },
          "limit_edges": {
            "type": "integer",
            "description": "Default 80, max 120 over MCP."
          }
        },
        "required": [
          "seed_type",
          "seed_id"
        ]
      },
      "annotations": {
        "title": "Correlation Subgraph",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "edges": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "source": {
                  "type": "string"
                },
                "target": {
                  "type": "string"
                },
                "fidelity_score": {
                  "type": "number",
                  "description": "Rounded 0-100."
                },
                "edge_type": {
                  "type": "string"
                },
                "weight_norm": {
                  "type": [
                    "number",
                    "null"
                  ]
                },
                "pmi": {
                  "type": "number",
                  "description": "NPMI edge types only (actor_technique, technique_cooccurrence)."
                },
                "co_occurrence_count": {
                  "type": "integer"
                },
                "marginals": {
                  "type": "object",
                  "properties": {
                    "c": {
                      "type": "integer"
                    },
                    "df_actor": {
                      "type": "integer"
                    },
                    "df_tech": {
                      "type": "integer"
                    },
                    "N": {
                      "type": "integer"
                    }
                  },
                  "additionalProperties": true
                }
              },
              "additionalProperties": true
            }
          },
          "counts": {
            "type": "object",
            "properties": {
              "nodes": {
                "type": "integer"
              },
              "edges": {
                "type": "integer"
              }
            },
            "additionalProperties": true
          },
          "truncated": {
            "type": "boolean"
          },
          "params_echo": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "seed": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/graph",
          "visibility": [
            "model",
            "app"
          ]
        }
      }
    },
    {
      "name": "search_corpus_semantic",
      "title": "Semantic Corpus Search",
      "description": "Vector + rerank retrieval over the whole corpus, returning ranked source cards. Use when keyword search fails — conceptual or paraphrased questions where the exact terms do not appear in the text. Complements search_threats, which is boolean/exact over structured filters. Depends on the AI Search binding and is rate-limited; a 503 means the index is unavailable, not that nothing matched.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "A natural-language question or concept."
          }
        },
        "required": [
          "query"
        ]
      },
      "annotations": {
        "title": "Semantic Corpus Search",
        "readOnlyHint": true,
        "idempotentHint": true,
        "destructiveHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "results": {
            "type": "array",
            "items": {}
          },
          "chunks": {
            "type": "array",
            "items": {}
          },
          "query": {
            "type": "string"
          }
        },
        "additionalProperties": true
      }
    }
  ],
  "prompts": [
    {
      "name": "triage_cve",
      "title": "Triage CVE",
      "description": "Triage a CVE end-to-end: severity, exploitation status, exposure, and prioritized remediation.",
      "arguments": [
        {
          "name": "cve_id",
          "description": "CVE identifier (e.g. CVE-2024-3400)",
          "required": true
        }
      ]
    },
    {
      "name": "profile_actor",
      "title": "Profile Actor",
      "description": "Build a threat-actor dossier: TTPs, targeting, attribution confidence, and notable campaigns.",
      "arguments": [
        {
          "name": "name",
          "description": "Actor name or alias (e.g. 'APT29', 'Lazarus Group')",
          "required": true
        }
      ]
    },
    {
      "name": "hunt_ioc",
      "title": "Hunt IOC",
      "description": "Hunt an indicator: linked threats/actors and recommended detection or blocking.",
      "arguments": [
        {
          "name": "value",
          "description": "Indicator value to hunt (IP, domain, hash, or URL)",
          "required": true
        }
      ]
    },
    {
      "name": "map_detections_to_mitre",
      "title": "Map Detections to MITRE",
      "description": "Map a threat's detections (SPL/KQL/Sigma) to ATT&CK techniques and flag coverage gaps.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat ID (e.g. TL-2026-0042)",
          "required": true
        }
      ]
    },
    {
      "name": "daily_brief",
      "title": "Daily Brief",
      "description": "Produce today's intel brief: posture summary, top new threats, and the day's theme.",
      "arguments": []
    },
    {
      "name": "assess_exposure",
      "title": "Assess Exposure",
      "description": "Assess exposure for a CVE, actor, or technique: what is covered vs uncovered, with recommended actions.",
      "arguments": [
        {
          "name": "cve_id",
          "description": "CVE identifier (e.g. CVE-2024-3400)",
          "required": false
        },
        {
          "name": "actor",
          "description": "Actor name or alias (e.g. 'APT29')",
          "required": false
        },
        {
          "name": "technique_id",
          "description": "MITRE technique ID (e.g. T1059)",
          "required": false
        }
      ]
    },
    {
      "name": "build_c2_blocklist",
      "title": "Build C2 Blocklist",
      "description": "Compile a deduplicated, copy-pasteable C2/IOC blocklist of network indicators mapped to threats.",
      "arguments": []
    },
    {
      "name": "hunt_corpus",
      "title": "Hunt the Corpus (TLQL)",
      "description": "Answer an aggregate or cross-observable question with TLQL over the hunt index.",
      "arguments": [
        {
          "name": "question",
          "description": "Plain-English question (e.g. \"which actors use T1059 with critical severity?\")",
          "required": true
        }
      ]
    },
    {
      "name": "explain_link",
      "title": "Explain a Correlation",
      "description": "Explain why two threats are linked, with the evidence and the shortest path between them.",
      "arguments": [
        {
          "name": "threat_a",
          "description": "First threat ID (e.g. TL-2026-0042)",
          "required": true
        },
        {
          "name": "threat_b",
          "description": "Second threat ID (e.g. TL-2026-0099)",
          "required": true
        }
      ]
    },
    {
      "name": "map_campaign",
      "title": "Map a Campaign",
      "description": "Map a campaign: member threats, shared infrastructure, pivotal entities, and the subgraph.",
      "arguments": [
        {
          "name": "name",
          "description": "Campaign name or cluster label",
          "required": true
        }
      ]
    },
    {
      "name": "review_detection_gaps",
      "title": "Review Detection Gaps",
      "description": "Find the highest-value detection debt: uncovered ATT&CK techniques ranked by exposure.",
      "arguments": [
        {
          "name": "tactic",
          "description": "Optional ATT&CK tactic to scope to (e.g. \"execution\", \"persistence\")",
          "required": false
        }
      ]
    },
    {
      "name": "write_detection",
      "title": "Write a Detection",
      "description": "Draft a deployable detection rule for a technique or threat, grounded in existing corpus logic.",
      "arguments": [
        {
          "name": "technique_id",
          "description": "MITRE technique ID (e.g. T1059)",
          "required": false
        },
        {
          "name": "threat_id",
          "description": "Threat ID (e.g. TL-2026-0042)",
          "required": false
        },
        {
          "name": "format",
          "description": "Output flavor: spl, kql or sigma",
          "required": false
        }
      ]
    },
    {
      "name": "review_attribution",
      "title": "Review an Attribution",
      "description": "Audit whether a threat's actor attribution is evidence-backed or a pending stub.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat ID (e.g. TL-2026-0042)",
          "required": true
        }
      ]
    },
    {
      "name": "predict_next_move",
      "title": "Predict the Next Move",
      "description": "Forecast likely next (or preceding) ATT&CK techniques from observed activity.",
      "arguments": [
        {
          "name": "technique_id",
          "description": "Observed MITRE technique ID (e.g. T1566)",
          "required": true
        },
        {
          "name": "direction",
          "description": "forward (what comes next) or reverse (what preceded)",
          "required": false
        }
      ]
    },
    {
      "name": "malware_dossier",
      "title": "Malware / Tool Dossier",
      "description": "Profile a malware family or offensive tool: usage, actors, threats, and related entities.",
      "arguments": [
        {
          "name": "name",
          "description": "Malware family or tool name (e.g. \"Cobalt Strike\", \"QakBot\")",
          "required": true
        }
      ]
    },
    {
      "name": "pivot_infrastructure",
      "title": "Pivot on Infrastructure",
      "description": "Pivot from an indicator or threat across DNS, hosting, and adjacent infrastructure.",
      "arguments": [
        {
          "name": "value",
          "description": "Indicator to pivot from (IP, domain, hash, URL)",
          "required": false
        },
        {
          "name": "threat_id",
          "description": "Threat ID to pivot from (e.g. TL-2026-0042)",
          "required": false
        }
      ]
    },
    {
      "name": "osint_sweep",
      "title": "OSINT Sweep",
      "description": "Fold community/OSINT signal into corpus intelligence and surface coverage lead time.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat ID to gather OSINT for (e.g. TL-2026-0042)",
          "required": false
        },
        {
          "name": "ioc_value",
          "description": "Indicator to gather OSINT for",
          "required": false
        }
      ]
    },
    {
      "name": "export_for_tooling",
      "title": "Export for Tooling",
      "description": "Produce STIX, ATT&CK Navigator, or SIEM-ready detection exports for downstream tools.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat ID to export (e.g. TL-2026-0042)",
          "required": false
        },
        {
          "name": "actor",
          "description": "Actor name to export (e.g. \"APT29\")",
          "required": false
        },
        {
          "name": "format",
          "description": "Detection flavor for export_detection: spl, kql or sigma",
          "required": false
        }
      ]
    },
    {
      "name": "plan_purple_team",
      "title": "Plan a Purple-Team Exercise",
      "description": "Build a purple-team plan for a threat: simulations to run and the detections they should trip.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat ID to exercise (e.g. TL-2026-0042)",
          "required": true
        }
      ]
    },
    {
      "name": "sweep_vulnerabilities",
      "title": "Sweep Vulnerabilities",
      "description": "Triage the vulnerability feed by exploitability and exposure, not by CVSS alone.",
      "arguments": [
        {
          "name": "vendor",
          "description": "Optional vendor to scope to (e.g. \"Fortinet\", \"Microsoft\")",
          "required": false
        },
        {
          "name": "window",
          "description": "Optional time window (e.g. \"7d\", \"30d\")",
          "required": false
        },
        {
          "name": "severity",
          "description": "Optional severity floor: critical, high, medium, low",
          "required": false
        }
      ]
    },
    {
      "name": "period_review",
      "title": "Period Review",
      "description": "Review a day or span of intelligence from the debrief archive.",
      "arguments": [
        {
          "name": "date",
          "description": "Date to review (YYYY-MM-DD); omit for the latest",
          "required": false
        }
      ]
    },
    {
      "name": "platform_status",
      "title": "Platform Status",
      "description": "Check corpus health, engine status, enrichment completeness, and recent changes.",
      "arguments": []
    },
    {
      "name": "orient",
      "title": "Orient (Start Here)",
      "description": "Orient an agent to the platform: catalog, corpus shape, categories, and query grammar.",
      "arguments": []
    },
    {
      "name": "research_question",
      "title": "Research an Open Question",
      "description": "Answer an open-ended question by semantic search across the corpus, then verify.",
      "arguments": [
        {
          "name": "question",
          "description": "Open-ended research question",
          "required": true
        }
      ]
    },
    {
      "name": "bulk_enrich",
      "title": "Bulk Enrich",
      "description": "Enrich a list of threat or CVE ids efficiently in batched calls.",
      "arguments": [
        {
          "name": "threat_ids",
          "description": "Comma-separated threat IDs (e.g. TL-2026-0042,TL-2026-0099)",
          "required": false
        },
        {
          "name": "cve_ids",
          "description": "Comma-separated CVE IDs (e.g. CVE-2024-3400,CVE-2023-4966)",
          "required": false
        }
      ]
    }
  ],
  "resources": [
    {
      "uri": "threadlinqs://stats",
      "name": "platform-stats",
      "title": "Platform Stats",
      "description": "Aggregate platform statistics: threat, detection, IOC, MITRE technique, and actor counts.",
      "mimeType": "application/json"
    },
    {
      "uri": "threadlinqs://threats/recent",
      "name": "recent-threats",
      "title": "Recent Threats",
      "description": "The most recently published threats (latest 20).",
      "mimeType": "application/json"
    },
    {
      "uri": "threadlinqs://briefing/landscape",
      "name": "landscape-briefing",
      "title": "Landscape Briefing",
      "description": "The latest synthesized threat-landscape posture briefing.",
      "mimeType": "application/json"
    },
    {
      "uri": "ui://threadlinqs/mitre-matrix",
      "name": "ui-mitre-matrix",
      "title": "MITRE ATT&CK Matrix",
      "description": "Interactive MITRE ATT&CK Matrix (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/threats",
      "name": "ui-threats",
      "title": "Threat Feed",
      "description": "Interactive Threat Feed (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/detections",
      "name": "ui-detections",
      "title": "Detection Library",
      "description": "Interactive Detection Library (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/iocs",
      "name": "ui-iocs",
      "title": "IOC Triage",
      "description": "Interactive IOC Triage (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/vulns",
      "name": "ui-vulns",
      "title": "Vulnerability Triage",
      "description": "Interactive Vulnerability Triage (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/graph",
      "name": "ui-graph",
      "title": "Correlation Graph",
      "description": "Interactive Correlation Graph (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/threat",
      "name": "ui-threat",
      "title": "Threat Dossier",
      "description": "Interactive Threat Dossier (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/hunt",
      "name": "ui-hunt",
      "title": "Hunt Results",
      "description": "Interactive Hunt Results (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/actor",
      "name": "ui-actor",
      "title": "Actor Dossier",
      "description": "Interactive Actor Dossier (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/c2",
      "name": "ui-c2",
      "title": "C2 Infrastructure",
      "description": "Interactive C2 Infrastructure (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    },
    {
      "uri": "ui://threadlinqs/detection",
      "name": "ui-detection",
      "title": "Detection Workbench",
      "description": "Interactive Detection Workbench (MCP Apps). Rendered inline by hosts that support the io.modelcontextprotocol/ui extension; ignored elsewhere.",
      "mimeType": "text/html;profile=mcp-app"
    }
  ],
  "resourceTemplates": [
    {
      "uriTemplate": "threadlinqs://threat/{id}",
      "name": "threat",
      "title": "Threat Detail",
      "description": "Full detail for a threat by ID (e.g. threadlinqs://threat/TL-2026-0042): overview, MITRE, IOCs, detections, timeline.",
      "mimeType": "application/json"
    },
    {
      "uriTemplate": "threadlinqs://cve/{id}",
      "name": "cve",
      "title": "CVE Detail",
      "description": "Enriched detail for a CVE by ID (e.g. threadlinqs://cve/CVE-2024-3400): CVSS, EPSS, KEV, references, linked threats.",
      "mimeType": "application/json"
    },
    {
      "uriTemplate": "threadlinqs://actor/{name}",
      "name": "actor",
      "title": "Actor Profile",
      "description": "Threat-actor profile by name or alias (e.g. threadlinqs://actor/APT29): attributed threats, techniques, IOCs.",
      "mimeType": "application/json"
    }
  ]
};

export default CATALOG_SNAPSHOT;
