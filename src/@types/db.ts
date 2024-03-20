export interface DynamoTTEntry {
        "pk": {
          "S": string;
        },
        "banner": {
          "S": string;
        },
        "profile": {
          "S": string;
        },
        "primary_color": {
          "S": string;
        },
        "secondary_color": {
          "S": string;
        },
        "adaHandle": {
          "S": string;
        },
        "asset": {
          "M": {
            "AssetId": {
              "S": string;
            },
            "AssetName": {
              "S": string;
            },
            "Decimals": {
              "N": string;
            },
            "Logo": {
              "NULL": true
            },
            "MintDate": {
              "M": {
                "Slot": {
                  "S": string;
                },
                "SlotOffset": {
                  "N": string;
                }
              }
            },
            "PolicyId": {
              "S": string;
            },
            "Ticker": {
              "S": string;
            },
            "TotalSupply": {
              "S": string;
            }
          }
        },
        "createdDate": {
          "M": {
            "Slot": {
              "S": string;
            },
            "SlotOffset": {
              "N": string;
            }
          }
        },
        "creationTxHash": {
          "S": string;
        },
        "endDate": {
          "M": {
            "Slot": {
              "S": string;
            },
            "SlotOffset": {
              "N": string;
            }
          }
        },
        "finalTxHash": {
          "NULL": true
        },
        "fundingAllocations": {
          "L": 
            {
              "M": {
                "Label": {
                  "S": string;
                },
                "Percentage": {
                  "N": string;
                }
              }
            }[]
        },
        "lastCallDate": {
          "M": {
            "Slot": {
              "S": string;
            },
            "SlotOffset": {
              "N": string;
            }
          }
        },
        "openDate": {
          "M": {
            "Slot": {
              "S": string;
            },
            "SlotOffset": {
              "N": string;
            }
          }
        },
        "parameters": {
          "M": {
            "beneficiaryAddress": {
              "S": string;
            },
            "foldFee": {
              "N": string;
            },
            "minUTXO": {
              "N": string;
            },
            "penaltyAddress": {
              "S": string;
            },
            "penaltyPercentage": {
              "N": string;
            },
            "poolFee": {
              "M": {
                "Denominator": {
                  "N": string;
                },
                "Numerator": {
                  "N": string;
                }
              }
            }
          }
        },
        "poolTxHash": {
          "NULL": true
        },
        "projectDetails": {
          "M": {
            "Description": {
              "S": string;
            },
            "Handle": {
              "S": "yes" | "no"
            },
            "Name": {
              "S": string;
            },
            "Socials": {
              "L": 
                {
                  "M": {
                    "Name": {
                      "S": string;
                    },
                    "Url": {
                      "S": string;
                    }
                  }
                }[]
            },
            "Team": {
              "M": {
                "Company": {
                  "S": string;
                },
                "Members": {
                  "L": {
                      "M": {
                        "Name": {
                          "S": string;
                        },
                        "Role": {
                          "S": string;
                        },
                        "Social": {
                          "NULL": true
                        }
                      }
                    }[]
                },
                "Other": {
                  "L": {
                      "S": string;
                    }[]
                },
                "Socials": {
                  "NULL": true
                }
              }
            },
            "Tokenomics": {
              "L":
                {
                  "M": {
                    "Label": {
                      "S": string;
                    },
                    "Percentage": {
                      "N": string;
                    }
                  }
                }[]
            }
          }
        },
        "projectTokens": {
          "N": string;
        },
        "scripts": {
          "M": {
            "CollectFoldPolicy": {
              "M": {
                "purpose": {
                  "S": "CollectFoldPolicy"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "CollectFoldValidator": {
              "M": {
                "purpose": {
                  "S": "CollectFoldValidator"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "RewardFoldPolicy": {
              "M": {
                "purpose": {
                  "S": "RewardFoldPolicy"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "RewardFoldValidator": {
              "M": {
                "purpose": {
                  "S": "RewardFoldValidator"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "TasteTestPolicy": {
              "M": {
                "purpose": {
                  "S": "TasteTestPolicy"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "TasteTestStakeValidator": {
              "M": {
                "purpose": {
                  "S": "TasteTestStakeValidator"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "TasteTestValidator": {
              "M": {
                "purpose": {
                  "S": "TasteTestValidator"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "TokenHolderPolicy": {
              "M": {
                "purpose": {
                  "S": "TokenHolderPolicy"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            },
            "TokenHolderValidator": {
              "M": {
                "purpose": {
                  "S": "TokenHolderValidator"
                },
                "scriptBytes": {
                  "NULL": true
                },
                "scriptHash": {
                  "S": string;
                },
                "utxo": {
                  "M": {
                    "index": {
                      "N": string;
                    },
                    "txId": {
                      "S": string;
                    }
                  }
                }
              }
            }
          }
        },
        "slug": {
          "S": string;
        },
        "type": {
          "S": "Liquidity" | "Direct"
        },
        "vestingSchedule": {
          "L": {
            "M": {
              "Address": {
                "S": string;
              },
              "Amount": {
                "S": string;
              },
              "Label": {
                "S": string;
              },
              "ReleaseDate": {
                "M": {
                  "Slot": {
                    "S": string;
                  },
                  "SlotOffset": {
                    "N": string;
                  }
                }
              }
            }
          }[]
        }
      }