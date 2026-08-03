// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: npm run sync:catalog
//
// Offline fallback for introspection. See scripts/sync-catalog.mjs for why this
// exists and for the release ordering that keeps it honest.
//
// Source : https://intel.threadlinqs.com/mcp/catalog.json
// Counts : 73 tools, 25 prompts, 14 resources, 3 resource templates

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
      "description": "Get the full detail for a single threat by its ID (e.g. TL-2026-0042): overview, MITRE techniques, IOCs, detections, timeline, and tags. For that threat's malware families, tools, targeted sectors/regions, affected OS and campaigns, call get_threat_enrichment.",
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
            "items": {}
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
      "description": "Get details for a specific MITRE ATT&CK technique by ID (e.g. T1059 or T1059.001).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "technique_id": {
            "type": "string",
            "description": "Technique ID (e.g. T1059 or T1059.001)"
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
      "description": "Reference-grounded enrichment for one threat by ID: the malware families and tools used, targeted sectors/regions, affected operating systems, named campaigns, AI/ML (ATLAS) techniques, and per-technique mitigations + detection data sources. Complements get_threat (overview/MITRE/IOCs/detections) — call this for the \"what malware/tools were used and who was targeted\" view.",
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
              "actor_count": {
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
                  "type": "string"
                },
                "title": {
                  "type": "string"
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
      "description": "Pivot on an offensive tool / utility / RMM / LOLBin by name (e.g. \"Cobalt Strike\", \"Mimikatz\", \"AnyDesk\", \"PsExec\"). Returns the canonical tool + class, prevalence, the threats and actors using it, and its most-common ATT&CK techniques.",
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
              "actor_count": {
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
                  "type": "string"
                },
                "title": {
                  "type": "string"
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
      "description": "Pivot on a named campaign / operation by name (e.g. \"Snowflake campaign\", \"ClickFix\"). Returns the threats in the campaign, the actors involved, prevalence, and common ATT&CK techniques.",
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
              "actor_count": {
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
                  "type": "string"
                },
                "title": {
                  "type": "string"
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
      "description": "Get a lean threat-actor profile by name or alias: actor metadata, attribution counts, attributed-threat summary rows, MITRE tactic rollup + technique ids, IOC category counts (no raw values), CVE/CWE/tool summaries, and relationships. For heavy detail use the follow-up tools: get_threat(id) for a full threat, search_detections / get_detection_detail for detection bodies, search_iocs for IOC values, get_infrastructure_pivots for shared infrastructure.",
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
            "properties": {},
            "additionalProperties": true
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
      "description": "List attributed threat actors with aggregate stats (threat_count, severity levels, categories, nation_state). Returns the full roster in one call, or narrow it with the optional tool / malware / sector filters (e.g. tool=\"Cobalt Strike\" → only actors that used it). Use get_actor for a single actor's full profile. Not paginated; the response carries a total count.",
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
      "name": "get_cve",
      "title": "Get CVE",
      "description": "Look up a CVE by identifier (e.g. CVE-2024-3400): description, CVSS, affected products, references, and linked threats.",
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
              "description": "Threats exploiting this CVE — pass to get_threat."
            }
          },
          "affected_products": {
            "type": "array",
            "items": {}
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
      "description": "Look up a CWE by identifier (e.g. CWE-79): weakness name, description, severity, related CVEs, and mitigation guidance.",
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
          "mitigations": {
            "type": "array",
            "items": {}
          },
          "related_cwes": {
            "type": "array",
            "items": {}
          },
          "threat_ids": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Pass to get_threat."
            }
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
            "description": "Max results (default 10, max 50)"
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
      "description": "Get the latest threat-landscape briefing — a synthesized posture summary of recent threat activity.",
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
                }
              },
              "additionalProperties": true
            }
          },
          "latest": {
            "type": [
              "object",
              "null"
            ]
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
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_daily_theme",
      "title": "Daily Theme",
      "description": "Get the day's landscape theme and top threat tags.",
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
                    "type": "string"
                  }
                },
                "threat_count": {
                  "type": "integer"
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
      "description": "Map the blast radius of one indicator: the threats that contain it, the MITRE techniques those threats use, and the actors + sibling IOCs in the same campaigns. Use this to scope impact of a single IOC; for a richer multi-source dossier on one indicator use get_ioc_intelligence instead.",
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
      "description": "For a given threat, surface cross-threat infrastructure links — shared IPs/domains and DNS-derived overlaps that tie it to other campaigns. Use to widen from a single threat to its infrastructure neighborhood; use get_similar_threats for TTP/actor-based similarity instead.",
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
            "description": "Max records for paginated views like beacons (default 50, max 100)"
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
      "description": "Predict the MITRE ATT&CK techniques most likely to follow (or precede) a given technique, with observed probabilities and example threats. Use forward to anticipate the next step in a kill chain; reverse to infer what came before. Pair with get_mitre_technique for the technique definition.",
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
      "name": "get_threat_simulations",
      "title": "Threat Simulations",
      "description": "Get the adversary-emulation / simulation playbooks attached to a threat — step-by-step commands by platform for safely reproducing the behavior in a lab. Use to operationalize detection testing for a specific threat.",
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
      "description": "List recent daily intelligence debriefs (newest first) with their per-day rollups: new/updated threats, themes, MITRE techniques, IOC breakdown, actors, and severity counts. Use to scan recent days; use get_debrief for the full detail of one date. Pass limit (default 30, max 100); the result includes has_more (true when the page is full, so older debriefs may exist). NOTE: the debriefs endpoint does not yet honor offset — it serves the most recent window.",
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
                "title": {
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
      "description": "Export a MITRE ATT&CK Navigator layer (enterprise-attack) for visualization. Pass actor=<name> to score techniques attributed to one actor, or all=true for platform-wide coverage. Returns {name, versions, domain, techniques:[{techniqueID, score, color, comment}]}, capped at 600 techniques.",
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
          "techniques": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "techniqueID": {
                  "type": "string"
                },
                "score": {
                  "type": "number"
                },
                "comment": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "gradient": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
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
      "description": "List adversary-emulation simulation scenarios across the platform (atomic test commands grouped by threat). Pass limit (default 50, max 200).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "description": "Max results (default 50, max 200)"
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
          "total": {
            "type": "integer"
          },
          "total_simulations": {
            "type": "integer"
          },
          "filter_meta": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          },
          "correlation": {
            "type": "object",
            "properties": {},
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_threat_transcripts",
      "title": "Get Threat Transcripts",
      "description": "Get the AI agent analysis transcripts for a threat — the step-by-step reasoning the research agents produced while profiling it.",
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
            "items": {}
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
      "description": "Prioritized list of MITRE ATT&CK techniques with the weakest detection coverage (detection debt), so you can target where to build detections next. Optionally filter by tactic.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "tactic": {
            "type": "string",
            "description": "Filter to one ATT&CK tactic (e.g. \"execution\")"
          },
          "limit": {
            "type": "number",
            "description": "Max techniques (default 20, max 100)"
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
                  "type": "string"
                },
                "technique_name": {
                  "type": "string"
                },
                "debt_score": {
                  "type": "number"
                },
                "priority_label": {
                  "type": "string"
                },
                "is_covered": {
                  "type": "boolean"
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
                "type": "integer"
              },
              "covered": {
                "type": "integer"
              },
              "gaps": {
                "type": "integer"
              },
              "coverage_pct": {
                "type": "number"
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
      "description": "Health and coverage overview of the enrichment sources (CVE/EPSS/KEV, IOC reputation, DNS, etc.) feeding the platform.",
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
                  "type": "string"
                },
                "total_events": {
                  "type": "integer"
                },
                "hit_rate": {
                  "type": "number"
                }
              },
              "additionalProperties": true
            }
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
                "type": "number"
              }
            },
            "additionalProperties": true
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_roadmap",
      "title": "Get Roadmap",
      "description": "Get the Threadlinqs Intelligence platform roadmap — shipped, in-progress, and planned capabilities.",
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
          "completed": {
            "type": "array",
            "items": {}
          }
        },
        "additionalProperties": true
      }
    },
    {
      "name": "get_changelog",
      "title": "Get Changelog",
      "description": "Get the recent platform changelog (new threats, detections, features). Pass limit (default 20, max 100).",
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
          "result": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {},
                "changes": {
                  "type": "array",
                  "items": {}
                }
              },
              "additionalProperties": true
            }
          }
        },
        "required": [
          "result"
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
      "description": "One-shot dossier for a threat: the full threat detail plus its simulations and analysis transcripts (include=\"summary\" returns just the threat). Fewer round-trips than calling get_threat + get_threat_simulations + get_threat_transcripts separately.",
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
      "description": "Flagship one-call hunting dossier for a threat: full detail + similar threats + simulations + infrastructure pivots, composed server-side. Best single tool to scope a hunt around one threat.",
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
            ]
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
            ]
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
      "name": "get_daily_intel_bundle",
      "title": "Daily Intel Bundle",
      "description": "One-shot \"what happened\" bundle: the day's debrief (latest by default, or pass date) plus platform stats, the top recent threats, and the correlations overview.",
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
            ]
          },
          "correlations_overview": {
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
      "name": "bulk_get_threats",
      "title": "Bulk Get Threats",
      "description": "Fetch up to 20 threats by ID in one call. Returns {threats, missing, count}. Use when you already have a list of threat IDs.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "threat_ids": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Threat IDs (max 20)"
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
            "type": "integer"
          }
        },
        "required": [
          "threats",
          "missing"
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
      "description": "Composite intelligence picture for a threat actor: the full actor profile plus cross-actor attribution correlations in one call.",
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
          "cross_actor_attribution": {
            "type": [
              "object",
              "null"
            ],
            "description": "Shared entities across actors, or null when the attribution engine has nothing."
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
      "description": "Composite CVE dossier: the enriched CVE detail plus exploitation-velocity context and any detections that reference it, in one call.",
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
              }
            },
            "additionalProperties": true
          },
          "velocity_data": {
            "type": [
              "object",
              "null"
            ]
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
      "description": "Run a deterministic SIEM-style query over the pre-joined observation index (~106k rows across tool, malware, ioc, mitre, cve, attribution, dns and infra observations). Use this INSTEAD of chaining many search_threats calls when the question is an aggregate (\"how many X grouped by Y\") or crosses observation types (\"threats using tool A that also have IOC type B\"). Append \"| stats count by <field>\" to aggregate; without it you get matching rows. Call hunt_schema first if you do not know the field names.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "TLQL, e.g. `tool = \"cobalt strike\" AND sector = \"healthcare\" | stats count by nation`"
          },
          "limit": {
            "type": "integer",
            "description": "Row cap for non-stats queries (default 50, max 150). Ignored in stats mode."
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
          "columns": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "count": {
            "type": "integer"
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
                  "type": "string"
                }
              },
              "combinators": {
                "type": "array",
                "items": {
                  "type": "string"
                }
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
                      "type": "string"
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
      "description": "One-call dossier for any node in the intelligence graph — threat, technique, actor, IOC or CVE. Returns its centrality/pivot rank, top graph neighbours with edge fidelity, and type-specific rollups (linked threats, techniques with risk scores, IOCs with consensus and rarity, campaigns, related CVEs). Best token-per-call ratio in the graph family: replaces five or six separate lookups.",
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
            "items": {}
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
      "description": "Campaign clusters the engine assembled from the similarity graph (connected components + label propagation): label, member count, cohesion, member threat IDs, top actors, top techniques, shared IOCs and nation-states. Distinct from get_campaign_intelligence, which looks up a NAMED campaign mentioned in threat text — this one reports clusters the engine derived itself.",
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
      "description": "MITRE ATT&CK technique PAIRS mined from the corpus with support, confidence and lift — which techniques travel together far above chance. Complements predict_mitre_transitions exactly: that answers sequence (what follows what), this answers co-occurrence (what appears alongside what).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Default 50, max 200."
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
                  "type": "string"
                },
                "technique_b": {
                  "type": "string"
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
                "type": "integer"
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
      "description": "The N-hop neighbourhood around any graph node — nodes, edges, and each edge's fidelity — for incremental exploration of the correlation graph. Start at depth 1 and expand: a whole-corpus graph exceeds every response budget. For a pre-aggregated single-entity view prefer get_entity_profile, which is cheaper and usually what you want; use this when you need the actual edge topology.",
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
            "description": "Drop edges below this fidelity (0-1)."
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
                "fidelity": {
                  "type": "number"
                },
                "edge_type": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            }
          },
          "params": {
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
