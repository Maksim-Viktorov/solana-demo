/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/bet_escrow.json`.
 */
export type BetEscrow = {
  "address": "HofsuPYrMhrRzpt4XFcMr4AvEu98WzTj7YPUofoEtdsv",
  "metadata": {
    "name": "betEscrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "assignVolunteer",
      "discriminator": [
        66,
        40,
        228,
        40,
        39,
        200,
        28,
        209
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "volunteerKyc",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  107,
                  121,
                  99
                ]
              },
              {
                "kind": "arg",
                "path": "volunteer"
              }
            ]
          }
        },
        {
          "name": "volunteerStake",
          "docs": [
            "program-owned (initialized) account, which proves they did not stake."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "arg",
                "path": "volunteer"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "volunteer",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "castVote",
      "discriminator": [
        20,
        212,
        15,
        189,
        69,
        180,
        69,
        151
      ],
      "accounts": [
        {
          "name": "volunteer",
          "signer": true
        },
        {
          "name": "event",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "option",
          "type": "u8"
        }
      ]
    },
    {
      "name": "claimPayout",
      "discriminator": [
        127,
        240,
        132,
        62,
        227,
        198,
        146,
        133
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "event",
          "writable": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "stake",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "claimRefund",
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "event",
          "writable": true,
          "relations": [
            "stake"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "stake",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "commitAiVerdict",
      "discriminator": [
        244,
        47,
        123,
        27,
        19,
        205,
        196,
        137
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "verdictHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "createEvent",
      "discriminator": [
        49,
        219,
        29,
        203,
        22,
        98,
        100,
        87
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "creatorKyc",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  107,
                  121,
                  99
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  118,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "eventId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "eventId",
          "type": "u64"
        },
        {
          "name": "optionCount",
          "type": "u8"
        },
        {
          "name": "rulesHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "deadline",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "treasury",
          "type": "pubkey"
        },
        {
          "name": "feeBps",
          "type": "u16"
        },
        {
          "name": "judgeBonus",
          "type": "u64"
        },
        {
          "name": "judgeBounty",
          "type": "u64"
        }
      ]
    },
    {
      "name": "markInvalidTimeout",
      "discriminator": [
        187,
        183,
        61,
        239,
        167,
        217,
        218,
        138
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Anyone can call this."
          ],
          "signer": true
        },
        {
          "name": "event",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "placeStake",
      "discriminator": [
        22,
        66,
        171,
        110,
        117,
        28,
        158,
        57
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userKyc",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  107,
                  121,
                  99
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "stake",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "event"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "option",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "recordMismatch",
      "discriminator": [
        89,
        83,
        155,
        22,
        215,
        168,
        34,
        143
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "volunteer",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "revealAndResolve",
      "discriminator": [
        125,
        238,
        42,
        28,
        131,
        200,
        170,
        56
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "event",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "event"
              }
            ]
          }
        },
        {
          "name": "volunteer",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "option",
          "type": "u8"
        },
        {
          "name": "salt",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "setKyc",
      "discriminator": [
        143,
        253,
        67,
        18,
        64,
        198,
        83,
        190
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "kycRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  107,
                  121,
                  99
                ]
              },
              {
                "kind": "arg",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "user",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "event",
      "discriminator": [
        125,
        192,
        125,
        158,
        9,
        115,
        152,
        233
      ]
    },
    {
      "name": "kycRecord",
      "discriminator": [
        60,
        42,
        41,
        19,
        198,
        74,
        18,
        101
      ]
    },
    {
      "name": "stake",
      "discriminator": [
        150,
        197,
        176,
        29,
        55,
        132,
        112,
        149
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidFee",
      "msg": "Fee must be at most 10000 bps"
    },
    {
      "code": 6001,
      "name": "invalidOptionCount",
      "msg": "Option count must be between 2 and 4"
    },
    {
      "code": 6002,
      "name": "deadlineInPast",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6003,
      "name": "invalidOption",
      "msg": "Option index out of range"
    },
    {
      "code": 6004,
      "name": "zeroAmount",
      "msg": "Stake amount must be greater than zero"
    },
    {
      "code": 6005,
      "name": "wrongState",
      "msg": "The event is not in the required state"
    },
    {
      "code": 6006,
      "name": "deadlinePassed",
      "msg": "The deadline has passed"
    },
    {
      "code": 6007,
      "name": "deadlineNotReached",
      "msg": "The deadline has not passed yet"
    },
    {
      "code": 6008,
      "name": "volunteerHasStake",
      "msg": "The volunteer has a stake in this event"
    },
    {
      "code": 6009,
      "name": "volunteerIsCreator",
      "msg": "The event creator cannot be the volunteer"
    },
    {
      "code": 6010,
      "name": "notAssignedVolunteer",
      "msg": "Signer is not the assigned volunteer"
    },
    {
      "code": 6011,
      "name": "alreadyVoted",
      "msg": "The volunteer has already voted"
    },
    {
      "code": 6012,
      "name": "noVote",
      "msg": "No vote has been cast yet"
    },
    {
      "code": 6013,
      "name": "hashMismatch",
      "msg": "Revealed verdict does not match the committed hash"
    },
    {
      "code": 6014,
      "name": "inconsistentReveal",
      "msg": "Revealed verdict equals an earlier round's vote that was recorded as a mismatch"
    },
    {
      "code": 6015,
      "name": "revealBeforeFinalRound",
      "msg": "A mismatch before the final round must use record_mismatch, not reveal"
    },
    {
      "code": 6016,
      "name": "finalRoundNeedsReveal",
      "msg": "Final round mismatch must be revealed"
    },
    {
      "code": 6017,
      "name": "notAWinner",
      "msg": "This stake did not win"
    },
    {
      "code": 6018,
      "name": "timeoutNotReached",
      "msg": "The resolution timeout has not passed"
    },
    {
      "code": 6019,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "judgeBonus",
            "type": "u64"
          },
          {
            "name": "judgeBounty",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "event",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "eventId",
            "type": "u64"
          },
          {
            "name": "optionCount",
            "type": "u8"
          },
          {
            "name": "rulesHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "eventState"
              }
            }
          },
          {
            "name": "winningOption",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "round",
            "docs": [
              "1..=3"
            ],
            "type": "u8"
          },
          {
            "name": "currentVolunteer",
            "docs": [
              "Pubkey::default() when nobody is assigned."
            ],
            "type": "pubkey"
          },
          {
            "name": "currentVote",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "pastVotes",
            "docs": [
              "Votes from rounds recorded as mismatches, checked at reveal time."
            ],
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "verdictHash",
            "docs": [
              "sha256(option || salt). The option itself is never stored before reveal."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "totalPool",
            "type": "u64"
          },
          {
            "name": "optionTotals",
            "type": {
              "array": [
                "u64",
                4
              ]
            }
          },
          {
            "name": "feeBps",
            "docs": [
              "Snapshot of the config fee when the event was created."
            ],
            "type": "u16"
          },
          {
            "name": "feeCollected",
            "type": "bool"
          },
          {
            "name": "judgePaid",
            "docs": [
              "Bonuses and bounties already paid out of the vault."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "eventState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "open"
          },
          {
            "name": "locked"
          },
          {
            "name": "awaitingVote"
          },
          {
            "name": "resolved"
          },
          {
            "name": "invalid"
          }
        ]
      }
    },
    {
      "name": "kycRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "verifiedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stake",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "event",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "option",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "docs": [
        "Program-owned vault, so the program can move lamports out directly."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "event",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "configSeed",
      "type": "bytes",
      "value": "[99, 111, 110, 102, 105, 103]"
    },
    {
      "name": "eventSeed",
      "type": "bytes",
      "value": "[101, 118, 101, 110, 116]"
    },
    {
      "name": "kycSeed",
      "type": "bytes",
      "value": "[107, 121, 99]"
    },
    {
      "name": "resolutionTimeoutSecs",
      "docs": [
        "After deadline + this, anyone can mark a stuck event Invalid."
      ],
      "type": "i64",
      "value": "259200"
    },
    {
      "name": "stakeSeed",
      "type": "bytes",
      "value": "[115, 116, 97, 107, 101]"
    },
    {
      "name": "unprovable",
      "docs": [
        "Vote / verdict value for \"evidence doesn't prove either option\"."
      ],
      "type": "u8",
      "value": "255"
    },
    {
      "name": "vaultSeed",
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    }
  ]
};
