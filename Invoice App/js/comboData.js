// comboData.js - Combo item definitions and category groupings

const comboDetails = {
    TSM:   { name: "Hand Towels, Bath Sheets, Bath Mats",                      codes: ["TWLHAND", "BATHSH", "BATHMA"] },
    TBM:   { name: "Hand Towels, Bath Towels, Bath Mats",                      codes: ["TWLHAND", "BATHTWL", "BATHMA"] },
    TBSM:  { name: "Hand Towels, Bath Towels, Bath Sheets, Bath Mats",         codes: ["TWLHAND", "BATHTWL", "BATHSH", "BATHMA"] },
    KLD:   { name: "King Fitted Sheet, King Duvet Cover",                      codes: ["KSFITSHT", "DUVCOVKS"] },
    KID:   { name: "King Flat Sheet, King Duvet Cover",                        codes: ["KSFLATSHT", "DUVCOVKS"] },
    QID:   { name: "Queen Fitted Sheet, Queen Duvet Cover",                    codes: ["QSFITSHT", "DUVCOVQU"] },
    QLD:   { name: "Queen Flat Sheet, Queen Duvet Cover",                      codes: ["QSFLATSHT", "DUVCOVQU"] },
    DLD:   { name: "Double Flat Sheet, Double Duvet Cover",                    codes: ["DOFLASHT", "DUVCOVDO"] },
    DID:   { name: "Double Fitted Sheet, Double Duvet Cover",                  codes: ["DOFITSHT", "DUVCOVDO"] },
    "3/4D":{ name: "3/4 Fitted Sheet, 3/4 Duvet Cover",                       codes: ["3/4FITSHT", "DUVCOV3/4"] },
    SID:   { name: "Single Fitted Sheet, Single Duvet Cover",                  codes: ["SIFITSHT", "DUVCOVSI"] },
    SLD:   { name: "Single Flat Sheet, Single Duvet Cover",                    codes: ["SIFLASHT", "DUVCOVSI"] },
    PCC:   { name: "Standard Pillow Case, Continental Pillow Case",            codes: ["PILLCASE", "CONTPCASE"] }
};

const categories = {
    "Linen":      ["KLD", "KID", "QID", "QLD", "DLD", "DID", "3/4D", "SID", "SLD"],
    "Towels":     ["TSM", "TBM", "TBSM"],
    "Pillowcases":["PCC"]
};
