// GENERATED FILE — DO NOT EDIT BY HAND.
// Regenerate with: npm run sync:catalog -- --local   (or --url at release time)
//
// Offline fallback for introspection. See scripts/sync-catalog.mjs for why this
// exists and for the release ordering that keeps it honest. The live tools/list
// is always authoritative; this is used only when the platform cannot be reached.
//
// Source : packages/mcp-v9 (npm run -s catalog -- --json)
// Server : 9.0.0
// Counts : 25 tools, 26 prompts, 10 resources, 4 resource templates

export interface CatalogSnapshot {
  tools: unknown[];
  prompts: unknown[];
  resources: unknown[];
  resourceTemplates: unknown[];
}

export const CATALOG_SNAPSHOT: CatalogSnapshot = {
  "tools": [
    {
      "name": "account",
      "title": "Account & TL Creds",
      "description": "Plan, TL Creds balance, today’s API/MCP spend and the platform’s prices (threat unlock, day passes, per-call tools, exports). Call before bulk work, or after a credits_required / api_cap_reached error to tell the user what is left and when it resets.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "plan": {
            "type": "object"
          },
          "pricing": {
            "type": "object"
          },
          "creds": {
            "type": "object"
          },
          "usage": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "attack_coverage",
      "title": "ATT&CK coverage",
      "description": "Detection coverage against ATT&CK. view=\"gaps\" (default): techniques ranked by detection debt — real threat exposure weighted by KEV/EPSS over rule count — i.e. what to build next. view=\"heatmap\": techniques by risk with threat and rule counts. view=\"tactics\": totals per tactic. view=\"matrix\": tactic columns. Tactic names follow ATT&CK v19 (Stealth, Defense Impairment); legacy labels are merged. Every view except tactics takes the correlation day pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string",
            "enum": [
              "gaps",
              "heatmap",
              "tactics",
              "matrix"
            ]
          },
          "tactic": {
            "description": "e.g. initial-access, stealth, command-and-control",
            "type": "string"
          },
          "limit": {
            "description": "default 15",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/matrix"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/matrix"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string"
          },
          "summary": {
            "type": "object"
          },
          "techniques": {
            "type": "array"
          },
          "tactics": {
            "type": "array"
          },
          "columns": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "brief",
      "title": "Daily brief",
      "description": "Start here for \"what is happening\": current threat posture (0–25 score with its drivers), the debrief’s theme, counts by severity and its threats, most severe first. Pass `date` for an earlier day (no debrief that day: not_found with the nearest days), `history` for a trend of recent days, include [\"watch\"] for the analyst watch-line.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "date": {
            "description": "YYYY-MM-DD (default: latest)",
            "type": "string"
          },
          "top": {
            "description": "Threats to list (default 8)",
            "type": "integer",
            "minimum": 1,
            "maximum": 20
          },
          "history": {
            "description": "Also return this many previous days (default 0)",
            "type": "integer",
            "minimum": 0,
            "maximum": 14
          },
          "include": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "watch"
              ]
            }
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/brief"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/brief"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string"
          },
          "posture": {
            "type": "object"
          },
          "today": {
            "type": "object"
          },
          "threats": {
            "type": "array"
          },
          "threats_total": {
            "type": "number"
          },
          "totals": {
            "type": "object"
          },
          "history": {
            "type": "array"
          },
          "headline": {
            "type": "string"
          },
          "watch": {
            "type": "string"
          }
        }
      }
    },
    {
      "name": "c2",
      "title": "C2 infrastructure",
      "description": "Command-and-control intelligence: view=\"summary\" (counts and feed health), beacons, configs, operators, watermarks, correlations, timeline, or dns (which domains ride on each beacon IP, with dedicated / mixed / shared fidelity). Always check meta.freshness: when the feed is offline results are a dated snapshot. For a firewall-ready list use export kind:\"blocklist\". view=\"dns\" takes the dns day pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "description": "Default summary",
            "type": "string",
            "enum": [
              "summary",
              "beacons",
              "configs",
              "operators",
              "watermarks",
              "correlations",
              "timeline",
              "dns"
            ]
          },
          "fidelity": {
            "description": "dns view only",
            "type": "string",
            "enum": [
              "dedicated",
              "mixed",
              "shared"
            ]
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string"
          },
          "summary": {
            "type": "object"
          },
          "rows": {
            "type": "array"
          },
          "detail": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "correlate",
      "title": "Correlate threats",
      "description": "Relate threats with evidence. mode=\"similar\": neighbours of one threat (blended score, falls back to attack-flow order for new threats). mode=\"explain\": why two threats are linked — per-channel scores and the shared techniques/IOCs/CVEs. mode=\"path\": shortest evidence path between two threats. Correlation is machine-derived: say \"the engine links…\", never \"same campaign\". Takes the correlation day pass; mode similar may also unlock the threat.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "mode": {
            "type": "string",
            "enum": [
              "similar",
              "explain",
              "path"
            ]
          },
          "a": {
            "type": "string",
            "description": "Threat id, e.g. TL-2026-5315 (the start, for path)"
          },
          "b": {
            "description": "Second threat id (explain; the end, for path)",
            "type": "string"
          },
          "max_hops": {
            "description": "Path search depth, default 6 (platform default)",
            "type": "integer",
            "minimum": 1,
            "maximum": 6
          },
          "limit": {
            "description": "default 8",
            "type": "integer",
            "minimum": 1,
            "maximum": 20
          }
        },
        "required": [
          "mode",
          "a"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "mode": {
            "type": "string"
          },
          "threat": {
            "type": "string"
          },
          "channel": {
            "type": "string"
          },
          "similar": {
            "type": "array"
          },
          "link": {
            "type": "object"
          },
          "path": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "export",
      "title": "Export for tooling",
      "description": "Package intelligence as a file for a SIEM or TIP: kind=\"stix\" (STIX 2.1 bundle for a threat, actor or CVE), \"navigator\" (ATT&CK Navigator layer for an actor), \"detections\" (all rules of a threat in one spl/kql/sigma file), \"blocklist\" (C2 IPs and domains). Returns a summary and a 15-minute download link, never the file inline. Threat bundles and rule packs use the threat unlock; actor bundles and layers take the actor_intel day pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string",
            "enum": [
              "stix",
              "navigator",
              "detections",
              "blocklist"
            ]
          },
          "threat_id": {
            "type": "string"
          },
          "actor": {
            "type": "string"
          },
          "cve_id": {
            "type": "string"
          },
          "lang": {
            "description": "detections only (default sigma)",
            "type": "string",
            "enum": [
              "spl",
              "kql",
              "sigma"
            ]
          },
          "include_osint": {
            "description": "stix only",
            "type": "boolean"
          },
          "confirm": {
            "description": "Set true after the user approved the spend",
            "type": "boolean"
          }
        },
        "required": [
          "kind"
        ]
      },
      "annotations": {
        "readOnlyHint": false,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "export": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "get_actor",
      "title": "Actor profile",
      "description": "Profile of one threat actor by name or alias: identity, counts, and by default recent threats, tactic profile and arsenal. `include` selects parts: threats, techniques, cves (with KEV/EPSS), arsenal (malware and tools, cleaned), targets, relationships (shared infrastructure/tooling — commodity tools are marked, not treated as links), attribution (how much of the labelling is research-backed). Takes the actor_intel pass (attribution: +correlation).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "include": {
            "description": "Default: [\"threats\",\"techniques\",\"arsenal\"]",
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "threats",
                "techniques",
                "cves",
                "arsenal",
                "targets",
                "relationships",
                "attribution"
              ]
            }
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/actor"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/actor"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "actor": {
            "type": "object"
          },
          "threats": {
            "type": "array"
          },
          "tactics": {
            "type": "array"
          },
          "techniques": {
            "type": "object"
          },
          "cves": {
            "type": "object"
          },
          "arsenal": {
            "type": "object"
          },
          "targets": {
            "type": "object"
          },
          "relationships": {
            "type": "object"
          },
          "attribution": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "get_cve",
      "title": "CVE dossier",
      "description": "One CVE (or up to 20 comma-separated ids): description, CVSS, EPSS, CISA KEV status with dates, patch availability and linked threats. `sections` adds exploitation (PoCs, nuclei), products, references, and corpus context: threats, actors, techniques, detections (roster only; correlation day pass).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "CVE-2025-53770 or a comma-separated list (max 20)"
          },
          "sections": {
            "description": "Default: [\"exploitation\"]",
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "exploitation",
                "products",
                "references",
                "threats",
                "detections",
                "actors",
                "techniques"
              ]
            }
          },
          "limit": {
            "description": "default 8",
            "type": "integer",
            "minimum": 1,
            "maximum": 30
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "cves": {
            "type": "array"
          },
          "missing": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "get_cwe",
      "title": "CWE weakness",
      "description": "One weakness class: definition, likelihood of exploit, consequences, mitigations by phase, and the corpus CVEs and threats that carry it (top by KEV then CVSS).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "CWE-502 or 502"
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 20
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "cwe": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "get_detection",
      "title": "Detection rule",
      "description": "One detection with its rule text, ready to deploy: metadata, ATT&CK mapping, data sources, false positives and tuning notes. `format` picks the flavour (spl, kql, sigma) or \"all\"; default is the rule’s native language. Rule text is never truncated.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Detection id, e.g. TL-2026-5315-SPL-002"
          },
          "format": {
            "type": "string",
            "enum": [
              "spl",
              "kql",
              "sigma",
              "cql",
              "all"
            ]
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/detection"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/detection"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "detection": {
            "type": "object"
          },
          "rule": {
            "type": "object"
          },
          "rules": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "get_entity",
      "title": "Malware / tool / campaign",
      "description": "Pivot on a malware family, an offensive tool or a named campaign: the threats that involve it, actors, techniques and related indicators. Use resolve_entity first if the name may be an alias.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string",
            "enum": [
              "malware",
              "tool",
              "campaign"
            ]
          },
          "name": {
            "type": "string"
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 40
          }
        },
        "required": [
          "kind",
          "name"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string"
          },
          "entity": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "get_ioc",
      "title": "Indicator dossier",
      "description": "Everything about one exact indicator: threats carrying it, with context, actors behind them, first seen, and a consensus verdict (confidence, rarity, trend). `include` adds radius (techniques, actors and sibling indicators; depth 1–3), dns (stored enrichment and pivots, never a live lookup) and osint (community sightings). Flags private, link-local and shared infrastructure (not adversary-owned). ioc_intel day pass; dns adds the dns pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "value": {
            "type": "string",
            "description": "Exact indicator value"
          },
          "include": {
            "description": "Default: [\"threats\"]",
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "threats",
                "radius",
                "dns",
                "osint"
              ]
            }
          },
          "depth": {
            "description": "Radius rings (default 3)",
            "type": "integer",
            "minimum": 1,
            "maximum": 3
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          }
        },
        "required": [
          "value"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "indicator": {
            "type": "object"
          },
          "threats": {
            "type": "array"
          },
          "radius": {
            "type": "object"
          },
          "dns": {
            "type": "object"
          },
          "osint": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "get_technique",
      "title": "ATT&CK technique",
      "description": "One ATT&CK technique (T1190, T1059.001, AML.T0010): authoritative name, tactics, mitigations, data sources and how many corpus threats use it. `include` adds threats (lean, paged), next / previous (techniques that typically follow or precede it, with probability and whether the order comes from authored attack flows; correlation day pass).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Technique id"
          },
          "include": {
            "description": "Default: none (the definition)",
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "threats",
                "next",
                "previous"
              ]
            }
          },
          "limit": {
            "description": "default 8",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "technique": {
            "type": "object"
          },
          "threats": {
            "type": "array"
          },
          "next": {
            "type": "array"
          },
          "previous": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "get_threat",
      "title": "Threat dossier",
      "description": "Open a threat, or up to 20 comma-separated ids as free lean rows. Sections: overview, description, attribution (actor; says if assessed), assessment (its evidence), techniques, iocs, detections, timeline, remediation, references, tags, updates, flow, similar, defense, enrichment, infrastructure. Default: overview, attribution, techniques, iocs, detections. Gated content unlocks it once (0 if held); similar and assessment take the correlation day pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "TL-2026-5315 or a comma-separated list (max 20)"
          },
          "sections": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "overview",
                "description",
                "attribution",
                "assessment",
                "techniques",
                "iocs",
                "detections",
                "timeline",
                "remediation",
                "references",
                "tags",
                "updates",
                "flow",
                "similar",
                "defense",
                "enrichment",
                "infrastructure"
              ]
            }
          },
          "limit": {
            "description": "Max items per list section (default 15)",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "confirm": {
            "description": "Set true after the user approved the spend",
            "type": "boolean"
          }
        },
        "required": [
          "id"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/threat"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/threat"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threats": {
            "type": "array"
          },
          "missing": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "graph",
      "title": "Correlation graph",
      "description": "Explore the entity graph. view=\"profile\": what surrounds one entity (threat, technique, actor, ioc, cve). view=\"subgraph\": nodes and edges around a seed (depth 1–2). view=\"pivotal\": entities that bridge many threats. Scores are heuristics that rank candidates; check meta.freshness — graph centrality is often days old. Takes the correlation day pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string",
            "enum": [
              "profile",
              "subgraph",
              "pivotal"
            ]
          },
          "type": {
            "description": "Entity type (profile/subgraph seed; optional filter for pivotal)",
            "type": "string",
            "enum": [
              "threat",
              "technique",
              "actor",
              "ioc",
              "cve"
            ]
          },
          "id": {
            "description": "Entity id or value (profile/subgraph)",
            "type": "string"
          },
          "depth": {
            "description": "Subgraph depth, default 1",
            "type": "integer",
            "minimum": 1,
            "maximum": 2
          },
          "limit": {
            "description": "default 15",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          }
        },
        "required": [
          "view"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string"
          },
          "profile": {
            "type": "object"
          },
          "subgraph": {
            "type": "object"
          },
          "entities": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "hunt",
      "title": "Hunt (TLQL)",
      "description": "SIEM-style query over the joined observation index — the tool for counts, group-bys and questions that cross types (\"threats using tool A that also have IOC type B\"). Syntax: `tool = \"cobalt strike\" AND sector = \"healthcare\" | stats count_distinct(threat) by nation`. Use count_distinct(threat) to count threats. Nation, severity and tactic groups are normalised and merged. Pass query \"?\" for the field grammar; a syntax error also returns it.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "TLQL, or \"?\" for the grammar"
          },
          "limit": {
            "description": "default 20",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          }
        },
        "required": [
          "query"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/hunt"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/hunt"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string"
          },
          "mode": {
            "type": "string"
          },
          "func": {
            "type": "string"
          },
          "by": {
            "type": "array"
          },
          "groups": {
            "type": "array"
          },
          "groups_total": {
            "type": "number"
          },
          "rows": {
            "type": "array"
          },
          "grammar": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "list_campaigns",
      "title": "Campaigns",
      "description": "Campaign rosters. source=\"named\" (default): operations named in reporting, with actors, nations, date range and member threats; each member says whether the campaign name really occurs in that threat (`supported`). source=\"engine\": similarity clusters computed by the graph engine. source=\"community\": clusters from the unverified OSINT feed. min_actors:2 finds multi-actor campaigns. Day pass: named actor_intel, engine correlation, community osint.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "source": {
            "type": "string",
            "enum": [
              "named",
              "engine",
              "community"
            ]
          },
          "min_actors": {
            "type": "integer",
            "minimum": 1,
            "maximum": 20
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 200
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "source": {
            "type": "string"
          },
          "campaigns": {
            "type": "array"
          },
          "coverage": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "osint",
      "title": "Community OSINT",
      "description": "Community-sourced signals (public OSINT feed): view=\"trends\" — volume, movers, lead time versus the curated corpus; view=\"threat\" — community sightings for one threat. Everything here is unverified: it corroborates curated findings and must stay labelled as community-sourced. view=\"threat\" unlocks the threat (0 if held).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "description": "Default trends, or threat when threat_id is given",
            "type": "string",
            "enum": [
              "trends",
              "threat"
            ]
          },
          "threat_id": {
            "type": "string"
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 30
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "view": {
            "type": "string"
          },
          "trends": {
            "type": "object"
          },
          "sightings": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "resolve_entity",
      "title": "Resolve a name",
      "description": "Normalise an actor, malware, tool, sector, region, technique or campaign name or alias to its canonical form (\"fancy bear\" → APT28). Call before pivoting when unsure a name will match; aliases:true also lists known aliases (actor_intel day pass).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "actor",
              "malware",
              "tool",
              "sector",
              "region",
              "technique",
              "campaign"
            ]
          },
          "aliases": {
            "type": "boolean"
          }
        },
        "required": [
          "name"
        ]
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "entity": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "search_actors",
      "title": "Search actors",
      "description": "List threat actors with threat counts, filtered by name fragment, tool, malware family, targeted sector or nation. Rows flagged role \"co-mention\" are never a primary attribution; `also_grounded_as` marks names the corpus also records as malware or tools. Open one with get_actor. Takes the actor_intel day pass.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "q": {
            "description": "Name fragment",
            "type": "string"
          },
          "tool": {
            "type": "string"
          },
          "malware": {
            "type": "string"
          },
          "sector": {
            "type": "string"
          },
          "nation": {
            "type": "string"
          },
          "limit": {
            "description": "default 20",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "actors": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "search_cves",
      "title": "Search CVEs",
      "description": "Query the live CVE feed (CVSS, EPSS, CISA KEV, public PoC/exploit, nuclei template). Answers \"what should we patch first\": filter with kev, epss_min, has_poc, severity, vendor, cwe, window_days; sort by priority, trending, latest, cvss, epss, or velocity (days from publication to first weaponisation; correlation day pass). Returns compact cards; details via get_cve.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "q": {
            "description": "CVE id or keyword",
            "type": "string"
          },
          "sort": {
            "description": "Default priority",
            "type": "string",
            "enum": [
              "priority",
              "trending",
              "latest",
              "cvss",
              "epss",
              "velocity"
            ]
          },
          "severity": {
            "type": "string",
            "enum": [
              "critical",
              "high",
              "medium",
              "low"
            ]
          },
          "kev": {
            "description": "Only CISA KEV",
            "type": "boolean"
          },
          "has_poc": {
            "type": "boolean"
          },
          "nuclei": {
            "type": "boolean"
          },
          "epss_min": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "window_days": {
            "description": "Published within N days",
            "type": "integer",
            "minimum": 1,
            "maximum": 3650
          },
          "vendor": {
            "type": "string"
          },
          "cwe": {
            "type": "string"
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/list"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/list"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "cves": {
            "type": "array"
          },
          "facets": {
            "type": "object"
          },
          "summary": {
            "type": "object"
          }
        }
      }
    },
    {
      "name": "search_detections",
      "title": "Search detections",
      "description": "Find detection rules (Splunk SPL, Microsoft KQL, Sigma) by keyword, threat, ATT&CK technique, language or severity. Returns lean rows without rule text; fetch a rule with get_detection. No filter = a page of the library (lean rows).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "q": {
            "description": "Keyword in rule text or name",
            "type": "string"
          },
          "threat_id": {
            "type": "string"
          },
          "technique": {
            "description": "ATT&CK id, e.g. T1505.003",
            "type": "string"
          },
          "lang": {
            "type": "string",
            "enum": [
              "spl",
              "kql",
              "sigma"
            ]
          },
          "severity": {
            "type": "string",
            "enum": [
              "critical",
              "high",
              "medium",
              "low"
            ]
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/list"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/list"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "detections": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "search_iocs",
      "title": "Search indicators",
      "description": "Find indicators by value (IP, domain, hash, URL, file name), newest first, grouped per indicator with the threats that carry it. Without `value` it lists the newest indicators (filter with type). `value` is a case-insensitive prefix by default; match=\"exact\" for one whole value, \"substring\" for anywhere in it (slower). source=\"community\" searches the unverified OSINT feed, not the curated corpus (osint day pass). For one exact indicator use get_ioc.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "value": {
            "description": "Start of the indicator value (see match); omit to list the newest",
            "type": "string"
          },
          "match": {
            "description": "corpus only",
            "type": "string",
            "enum": [
              "prefix",
              "exact",
              "substring"
            ]
          },
          "type": {
            "description": "corpus: network | file | behavioral · community: ip | domain | url | sha256 | md5",
            "type": "string"
          },
          "source": {
            "description": "Default corpus",
            "type": "string",
            "enum": [
              "corpus",
              "community"
            ]
          },
          "limit": {
            "description": "default 15",
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/list"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/list"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "indicators": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "search_threats",
      "title": "Search threats",
      "description": "Find threats in the catalog. No arguments = newest first. Combine free-text `q` with structured filters (all AND). Returns lean rows; open one with get_threat. For counts or group-bys use hunt instead of paging. mode=\"semantic\" searches by meaning when keywords miss (slower, charged per call).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "q": {
            "description": "Free text over title, summary, CVE, actor",
            "type": "string"
          },
          "severity": {
            "type": "string",
            "enum": [
              "critical",
              "high",
              "medium",
              "low"
            ]
          },
          "category": {
            "description": "e.g. RANSOMWARE, SUPPLY_CHAIN, VULNERABILITY, APT, PHISHING",
            "type": "string"
          },
          "actor": {
            "description": "Actor name or alias",
            "type": "string"
          },
          "nation": {
            "description": "Country name or ISO code",
            "type": "string"
          },
          "malware": {
            "type": "string"
          },
          "tool": {
            "type": "string"
          },
          "campaign": {
            "type": "string"
          },
          "cve": {
            "type": "string"
          },
          "technique": {
            "description": "ATT&CK id, e.g. T1190",
            "type": "string"
          },
          "sector": {
            "type": "string"
          },
          "region": {
            "type": "string"
          },
          "product": {
            "description": "Affected vendor/product",
            "type": "string"
          },
          "tag": {
            "type": "string"
          },
          "status": {
            "description": "e.g. ACTIVE, MONITORING",
            "type": "string"
          },
          "motivation": {
            "description": "e.g. financial, espionage",
            "type": "string"
          },
          "os": {
            "description": "e.g. Windows, Linux, VMware ESXi",
            "type": "string"
          },
          "since": {
            "description": "YYYY-MM-DD, created on/after",
            "type": "string"
          },
          "until": {
            "description": "YYYY-MM-DD, created on/before",
            "type": "string"
          },
          "mode": {
            "description": "Default keyword",
            "type": "string",
            "enum": [
              "keyword",
              "semantic"
            ]
          },
          "limit": {
            "description": "default 10",
            "type": "integer",
            "minimum": 1,
            "maximum": 50
          },
          "cursor": {
            "description": "page.next_cursor of the previous call",
            "type": "string"
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": false,
        "openWorldHint": false
      },
      "_meta": {
        "ui": {
          "resourceUri": "ui://threadlinqs/v9/list"
        },
        "ui/resourceUri": "ui://threadlinqs/v9/list"
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "threats": {
            "type": "array"
          }
        }
      }
    },
    {
      "name": "status",
      "title": "Platform status",
      "description": "Health and freshness in a few hundred bytes: server version, corpus counts, which correlation engines are stale, graph-pipeline state and feed outages. Check before leaning on correlation, similarity or C2 data. `include` adds: breakdown, top (techniques, actors, malware, tools, sectors), changelog, roadmap, categories, attribution, enrichment, flows (the last three take the correlation day pass).",
      "inputSchema": {
        "type": "object",
        "properties": {
          "include": {
            "description": "Default: [\"engines\"]",
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "engines",
                "breakdown",
                "top",
                "changelog",
                "roadmap",
                "categories",
                "attribution",
                "enrichment",
                "flows"
              ]
            }
          }
        }
      },
      "annotations": {
        "readOnlyHint": true,
        "destructiveHint": false,
        "idempotentHint": true,
        "openWorldHint": false
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "server": {
            "type": "object"
          },
          "ok": {
            "type": "boolean"
          },
          "corpus": {
            "type": "object"
          },
          "engines": {
            "type": "object"
          },
          "pipeline": {
            "type": "object"
          },
          "feeds": {
            "type": "object"
          },
          "breakdown": {
            "type": "object"
          },
          "top": {
            "type": "object"
          },
          "changelog": {
            "type": "array"
          },
          "roadmap": {
            "type": "object"
          },
          "categories": {
            "type": "array"
          },
          "attribution": {
            "type": "object"
          },
          "enrichment": {
            "type": "object"
          },
          "flows": {
            "type": "object"
          }
        }
      }
    }
  ],
  "prompts": [
    {
      "name": "assess_exposure",
      "title": "Assess exposure",
      "description": "What is covered and what is not for a CVE, an actor or a technique.",
      "arguments": [
        {
          "name": "cve_id",
          "description": "CVE id",
          "required": false
        },
        {
          "name": "actor",
          "description": "Actor name",
          "required": false
        },
        {
          "name": "technique_id",
          "description": "ATT&CK technique id",
          "required": false
        }
      ]
    },
    {
      "name": "build_c2_blocklist",
      "title": "Build a C2 blocklist",
      "description": "A firewall-ready list of command-and-control infrastructure.",
      "arguments": []
    },
    {
      "name": "bulk_enrich",
      "title": "Bulk enrich",
      "description": "Enrich a list of threat or CVE ids in as few calls as possible.",
      "arguments": [
        {
          "name": "threat_ids",
          "description": "Comma-separated threat ids",
          "required": false
        },
        {
          "name": "cve_ids",
          "description": "Comma-separated CVE ids",
          "required": false
        }
      ]
    },
    {
      "name": "daily_brief",
      "title": "Daily brief",
      "description": "What changed today and what to act on first.",
      "arguments": [
        {
          "name": "focus",
          "description": "Optional sector, product or actor to emphasise",
          "required": false
        }
      ]
    },
    {
      "name": "explain_link",
      "title": "Explain a link",
      "description": "Why two threats are related, with the evidence.",
      "arguments": [
        {
          "name": "threat_a",
          "description": "First threat id",
          "required": true
        },
        {
          "name": "threat_b",
          "description": "Second threat id",
          "required": true
        }
      ]
    },
    {
      "name": "export_for_tooling",
      "title": "Export for SIEM / TIP",
      "description": "STIX, ATT&CK Navigator or a rule pack for downstream tools.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": false
        },
        {
          "name": "actor",
          "description": "Actor name",
          "required": false
        },
        {
          "name": "format",
          "description": "Detection flavour: spl | kql | sigma",
          "required": false
        },
        {
          "name": "kind",
          "description": "stix | navigator | detections | blocklist (default: stix, or navigator for an actor alone, or detections when a format is given)",
          "required": false
        }
      ]
    },
    {
      "name": "hunt_corpus",
      "title": "Hunt the corpus",
      "description": "Answer a \"how many X by Y\" question with one aggregate query.",
      "arguments": [
        {
          "name": "question",
          "description": "The question, in plain words",
          "required": true
        }
      ]
    },
    {
      "name": "hunt_ioc",
      "title": "Hunt an indicator",
      "description": "Scope one IP, domain, hash or URL.",
      "arguments": [
        {
          "name": "value",
          "description": "Indicator value",
          "required": true
        }
      ]
    },
    {
      "name": "investigate_threat",
      "title": "Investigate a threat",
      "description": "Full picture of one threat: chain, indicators, detections, neighbours.",
      "arguments": [
        {
          "name": "id",
          "description": "Threat id, e.g. TL-2026-5315",
          "required": true
        }
      ]
    },
    {
      "name": "malware_dossier",
      "title": "Malware or tool dossier",
      "description": "Profile a malware family or offensive tool.",
      "arguments": [
        {
          "name": "name",
          "description": "Malware family or tool name",
          "required": true
        }
      ]
    },
    {
      "name": "map_campaign",
      "title": "Map a campaign",
      "description": "Members, actors, shared infrastructure and timeline of a campaign.",
      "arguments": [
        {
          "name": "name",
          "description": "Campaign name",
          "required": true
        }
      ]
    },
    {
      "name": "map_detections_to_mitre",
      "title": "Map detections to ATT&CK",
      "description": "Which techniques of a threat have rules, and which do not.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": true
        }
      ]
    },
    {
      "name": "orient",
      "title": "Orient",
      "description": "What this server holds and how to query it.",
      "arguments": []
    },
    {
      "name": "osint_sweep",
      "title": "OSINT sweep",
      "description": "Add community sightings to what the corpus knows.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": false
        },
        {
          "name": "ioc_value",
          "description": "Indicator value",
          "required": false
        }
      ]
    },
    {
      "name": "period_review",
      "title": "Period review",
      "description": "Review one day, or the last two weeks, of intelligence.",
      "arguments": [
        {
          "name": "date",
          "description": "Day to review (YYYY-MM-DD); omit for the last 14 days",
          "required": false
        }
      ]
    },
    {
      "name": "pivot_infrastructure",
      "title": "Pivot on infrastructure",
      "description": "Follow an indicator or a threat across DNS and shared hosting.",
      "arguments": [
        {
          "name": "value",
          "description": "Indicator value",
          "required": false
        },
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": false
        }
      ]
    },
    {
      "name": "plan_purple_team",
      "title": "Plan a purple-team exercise",
      "description": "Steps to emulate from a threat, and the rule each should trigger.",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": true
        }
      ]
    },
    {
      "name": "platform_status",
      "title": "Platform status",
      "description": "Corpus health, engine freshness and feed outages.",
      "arguments": []
    },
    {
      "name": "predict_next_move",
      "title": "Predict the next move",
      "description": "Likely next (or previous) techniques after an observed one.",
      "arguments": [
        {
          "name": "technique_id",
          "description": "Observed ATT&CK technique id",
          "required": true
        },
        {
          "name": "direction",
          "description": "forward | reverse (or next | previous)",
          "required": false
        }
      ]
    },
    {
      "name": "profile_actor",
      "title": "Profile an actor",
      "description": "Who they are, how they operate, what to watch.",
      "arguments": [
        {
          "name": "name",
          "description": "Actor name or alias",
          "required": true
        }
      ]
    },
    {
      "name": "research_question",
      "title": "Research a question",
      "description": "Open-ended question: semantic search, then verify in the records.",
      "arguments": [
        {
          "name": "question",
          "description": "The question, in plain words",
          "required": true
        }
      ]
    },
    {
      "name": "review_attribution",
      "title": "Review an attribution",
      "description": "Is the actor on a threat evidence-backed or only a feed label?",
      "arguments": [
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": true
        }
      ]
    },
    {
      "name": "review_detection_gaps",
      "title": "Review detection gaps",
      "description": "Where coverage is weakest against real exposure.",
      "arguments": [
        {
          "name": "tactic",
          "description": "ATT&CK tactic, e.g. initial-access",
          "required": false
        }
      ]
    },
    {
      "name": "sweep_vulnerabilities",
      "title": "Sweep vulnerabilities",
      "description": "Triage the CVE feed by exploitability, not by CVSS alone.",
      "arguments": [
        {
          "name": "vendor",
          "description": "Vendor or product",
          "required": false
        },
        {
          "name": "window",
          "description": "24h | 7d | 30d | 90d",
          "required": false
        },
        {
          "name": "severity",
          "description": "critical | high | medium | low",
          "required": false
        }
      ]
    },
    {
      "name": "triage_cve",
      "title": "Triage a CVE",
      "description": "Is it exploited, are we covered, what to do.",
      "arguments": [
        {
          "name": "cve_id",
          "description": "CVE id",
          "required": true
        }
      ]
    },
    {
      "name": "write_detection",
      "title": "Write or adapt a detection",
      "description": "Start from an existing rule and tune it for an environment.",
      "arguments": [
        {
          "name": "technique_id",
          "description": "ATT&CK technique id",
          "required": false
        },
        {
          "name": "threat_id",
          "description": "Threat id",
          "required": false
        },
        {
          "name": "format",
          "description": "spl | kql | sigma",
          "required": false
        }
      ]
    }
  ],
  "resources": [
    {
      "uri": "ui://threadlinqs/v9/actor",
      "name": "view-actor",
      "mimeType": "text/html;profile=mcp-app",
      "title": "Actor profile",
      "description": "Attribution basis, ATT&CK footprint, arsenal, targets, recent threats and exploited CVEs.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "ui://threadlinqs/v9/brief",
      "name": "view-brief",
      "mimeType": "text/html;profile=mcp-app",
      "title": "Daily brief",
      "description": "Posture gauge, today’s threats by severity, theme and history.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "ui://threadlinqs/v9/detection",
      "name": "view-detection",
      "mimeType": "text/html;profile=mcp-app",
      "title": "Detection rule",
      "description": "One rule in SPL, KQL or Sigma with ATT&CK mapping, false positives and tuning notes.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "ui://threadlinqs/v9/hunt",
      "name": "view-hunt",
      "mimeType": "text/html;profile=mcp-app",
      "title": "Hunt results",
      "description": "Group-by bars and row table for a TLQL query.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "ui://threadlinqs/v9/list",
      "name": "view-list",
      "mimeType": "text/html;profile=mcp-app",
      "title": "Results",
      "description": "Filterable, pageable lists of threats, CVEs, detections or indicators.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "ui://threadlinqs/v9/matrix",
      "name": "view-matrix",
      "mimeType": "text/html;profile=mcp-app",
      "title": "ATT&CK coverage",
      "description": "Tactic columns with detection-debt heat and coverage totals.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "ui://threadlinqs/v9/threat",
      "name": "view-threat",
      "mimeType": "text/html;profile=mcp-app",
      "title": "Threat dossier",
      "description": "Overview, attack-flow graph, indicators, detections and related threats.",
      "_meta": {
        "ui": {
          "prefersBorder": false
        }
      }
    },
    {
      "uri": "threadlinqs://briefing/landscape",
      "name": "briefing",
      "title": "Current briefing",
      "description": "Posture and today’s threats (same as the brief tool).",
      "mimeType": "application/json"
    },
    {
      "uri": "threadlinqs://stats",
      "name": "stats",
      "title": "Platform status",
      "description": "Corpus counts and engine freshness (same as the status tool).",
      "mimeType": "application/json"
    },
    {
      "uri": "threadlinqs://threats/recent",
      "name": "recent",
      "title": "Recent threats",
      "description": "Newest threats, lean rows.",
      "mimeType": "application/json"
    }
  ],
  "resourceTemplates": [
    {
      "name": "threat",
      "uriTemplate": "threadlinqs://threat/{id}",
      "title": "Threat",
      "description": "One threat dossier (default sections).",
      "mimeType": "application/json"
    },
    {
      "name": "cve",
      "uriTemplate": "threadlinqs://cve/{id}",
      "title": "CVE",
      "description": "One CVE with exploitation status.",
      "mimeType": "application/json"
    },
    {
      "name": "actor",
      "uriTemplate": "threadlinqs://actor/{name}",
      "title": "Actor",
      "description": "One actor profile.",
      "mimeType": "application/json"
    },
    {
      "name": "export",
      "uriTemplate": "threadlinqs://export/{handle}{?part}",
      "title": "Prepared export",
      "description": "A STIX bundle, Navigator layer, rule pack or blocklist produced by the export tool. Read part=1..N."
    }
  ]
};

export default CATALOG_SNAPSHOT;
