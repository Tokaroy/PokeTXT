import type { Item } from "@/types";

export const GEN1_ITEMS: Item[] = [
  // Pokeballs
  {id:1,name:"Poké Ball",type:"PokeBall",description:"A device for catching wild Pokémon.",price:200,sellPrice:100,effect:{type:"catch",value:1}},
  {id:2,name:"Great Ball",type:"PokeBall",description:"A good ball with a higher catch rate than a Poké Ball.",price:600,sellPrice:300,effect:{type:"catch",value:1.5}},
  {id:3,name:"Ultra Ball",type:"PokeBall",description:"A better ball with a higher catch rate than a Great Ball.",price:1200,sellPrice:600,effect:{type:"catch",value:2}},
  {id:4,name:"Master Ball",type:"PokeBall",description:"The best ball that catches a Pokémon without fail.",price:0,sellPrice:0,effect:{type:"catch",value:255}},

  // Potions
  {id:5,name:"Potion",type:"Potion",description:"Restores 20 HP to a Pokémon.",price:300,sellPrice:150,effect:{type:"heal",value:20}},
  {id:6,name:"Super Potion",type:"Potion",description:"Restores 50 HP to a Pokémon.",price:700,sellPrice:350,effect:{type:"heal",value:50}},
  {id:7,name:"Hyper Potion",type:"Potion",description:"Restores 200 HP to a Pokémon.",price:1500,sellPrice:750,effect:{type:"heal",value:200}},
  {id:8,name:"Max Potion",type:"Potion",description:"Fully restores a Pokémon's HP.",price:2500,sellPrice:1250,effect:{type:"heal",value:999}},
  {id:9,name:"Full Restore",type:"Potion",description:"Fully restores HP and cures all status problems.",price:3000,sellPrice:1500,effect:{type:"healFull"}},

  // Status Heals
  {id:10,name:"Antidote",type:"StatusHeal",description:"Heals a poisoned Pokémon.",price:100,sellPrice:50,effect:{type:"cure",value:"poison"}},
  {id:11,name:"Paralyze Heal",type:"StatusHeal",description:"Heals a paralyzed Pokémon.",price:200,sellPrice:100,effect:{type:"cure",value:"paralysis"}},
  {id:12,name:"Awakening",type:"StatusHeal",description:"Wakes up a sleeping Pokémon.",price:250,sellPrice:125,effect:{type:"cure",value:"sleep"}},
  {id:13,name:"Burn Heal",type:"StatusHeal",description:"Heals a burned Pokémon.",price:250,sellPrice:125,effect:{type:"cure",value:"burn"}},
  {id:14,name:"Ice Heal",type:"StatusHeal",description:"Defrosts a frozen Pokémon.",price:250,sellPrice:125,effect:{type:"cure",value:"freeze"}},
  {id:15,name:"Full Heal",type:"StatusHeal",description:"Heals all status problems of a Pokémon.",price:600,sellPrice:300,effect:{type:"cureAll"}},

  // Revives
  {id:16,name:"Revive",type:"Potion",description:"Revives a fainted Pokémon with half HP.",price:1500,sellPrice:750,effect:{type:"revive",value:0.5}},
  {id:17,name:"Max Revive",type:"Potion",description:"Revives a fainted Pokémon with full HP.",price:4000,sellPrice:2000,effect:{type:"revive",value:1}},

  // Ethers
  {id:18,name:"Ether",type:"Other",description:"Restores 10 PP to one move.",price:0,sellPrice:0,effect:{type:"restorePP",value:10}},
  {id:19,name:"Max Ether",type:"Other",description:"Fully restores PP to one move.",price:0,sellPrice:0,effect:{type:"restorePP",value:99}},
  {id:20,name:"Elixir",type:"Other",description:"Restores 10 PP to all moves.",price:0,sellPrice:0,effect:{type:"restorePPAll",value:10}},
  {id:21,name:"Max Elixir",type:"Other",description:"Fully restores PP to all moves.",price:0,sellPrice:0,effect:{type:"restorePPAll",value:99}},

  // Evolution Stones
  {id:22,name:"Fire Stone",type:"Evolution",description:"Makes certain species of Pokémon evolve.",price:2100,sellPrice:1050,effect:{type:"evolve"}},
  {id:23,name:"Water Stone",type:"Evolution",description:"Makes certain species of Pokémon evolve.",price:2100,sellPrice:1050,effect:{type:"evolve"}},
  {id:24,name:"Thunder Stone",type:"Evolution",description:"Makes certain species of Pokémon evolve.",price:2100,sellPrice:1050,effect:{type:"evolve"}},
  {id:25,name:"Leaf Stone",type:"Evolution",description:"Makes certain species of Pokémon evolve.",price:2100,sellPrice:1050,effect:{type:"evolve"}},
  {id:26,name:"Moon Stone",type:"Evolution",description:"Makes certain species of Pokémon evolve.",price:0,sellPrice:0,effect:{type:"evolve"}},

  // Key Items
  {id:27,name:"Bicycle",type:"KeyItem",description:"A folding bicycle that is faster than running shoes.",price:0,sellPrice:0},
  {id:28,name:"Old Rod",type:"KeyItem",description:"Use it by any body of water to fish for wild Pokémon.",price:0,sellPrice:0},
  {id:29,name:"Good Rod",type:"KeyItem",description:"A better rod for catching wild Pokémon.",price:0,sellPrice:0},
  {id:30,name:"Super Rod",type:"KeyItem",description:"The best rod for catching wild Pokémon.",price:0,sellPrice:0},
  {id:31,name:"Itemfinder",type:"KeyItem",description:"Checks for unseen items in the area.",price:0,sellPrice:0},
  {id:32,name:"SS Ticket",type:"KeyItem",description:"The ticket required for sailing on the S.S. Anne.",price:0,sellPrice:0},
  {id:33,name:"Secret Key",type:"KeyItem",description:"The key to the Cinnabar Island Gym's entrance.",price:0,sellPrice:0},
  {id:34,name:"Poké Flute",type:"KeyItem",description:"Plays a pleasant melody that rouses Pokémon.",price:0,sellPrice:0},
  {id:35,name:"Lift Key",type:"KeyItem",description:"An elevator key used in Team Rocket's Hideout.",price:0,sellPrice:0},
  {id:36,name:"Silph Scope",type:"KeyItem",description:"A scope that makes unseeable Pokémon visible.",price:0,sellPrice:0},

  // HMs
  {id:37,name:"HM01 Cut",type:"HM",description:"Cuts down thin trees. Usable out of battle.",price:0,sellPrice:0,effect:{type:"hm",moveId:15}},
  {id:38,name:"HM02 Fly",type:"HM",description:"Flies to any familiar town. Usable out of battle.",price:0,sellPrice:0,effect:{type:"hm",moveId:19}},
  {id:39,name:"HM03 Surf",type:"HM",description:"Attacks while crossing water. Usable out of battle.",price:0,sellPrice:0,effect:{type:"hm",moveId:57}},
  {id:40,name:"HM04 Strength",type:"HM",description:"Builds enormous power, then slams the foe. Moves boulders.",price:0,sellPrice:0,effect:{type:"hm",moveId:70}},
  {id:41,name:"HM05 Flash",type:"HM",description:"Looses a powerful blast of light that cuts accuracy.",price:0,sellPrice:0,effect:{type:"hm",moveId:148}},

  // TMs (sample of key TMs)
  {id:42,name:"TM01 Mega Punch",type:"TM",description:"Teaches Mega Punch to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:5}},
  {id:43,name:"TM02 Razor Wind",type:"TM",description:"Teaches Razor Wind to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:13}},
  {id:44,name:"TM03 Swords Dance",type:"TM",description:"Teaches Swords Dance to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:14}},
  {id:45,name:"TM04 Whirlwind",type:"TM",description:"Teaches Whirlwind to a compatible Pokémon.",price:1000,sellPrice:500,effect:{type:"tm",moveId:18}},
  {id:46,name:"TM05 Mega Kick",type:"TM",description:"Teaches Mega Kick to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:25}},
  {id:47,name:"TM06 Toxic",type:"TM",description:"Teaches Toxic to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:92}},
  {id:48,name:"TM07 Horn Drill",type:"TM",description:"Teaches Horn Drill to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:32}},
  {id:49,name:"TM08 Body Slam",type:"TM",description:"Teaches Body Slam to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:34}},
  {id:50,name:"TM09 Take Down",type:"TM",description:"Teaches Take Down to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:36}},
  {id:51,name:"TM10 Double-Edge",type:"TM",description:"Teaches Double-Edge to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:38}},
  {id:52,name:"TM11 Bubble Beam",type:"TM",description:"Teaches Bubble Beam to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:61}},
  {id:53,name:"TM12 Water Gun",type:"TM",description:"Teaches Water Gun to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:55}},
  {id:54,name:"TM13 Ice Beam",type:"TM",description:"Teaches Ice Beam to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:58}},
  {id:55,name:"TM14 Blizzard",type:"TM",description:"Teaches Blizzard to a compatible Pokémon.",price:5500,sellPrice:2750,effect:{type:"tm",moveId:59}},
  {id:56,name:"TM15 Hyper Beam",type:"TM",description:"Teaches Hyper Beam to a compatible Pokémon.",price:7500,sellPrice:3750,effect:{type:"tm",moveId:63}},
  {id:57,name:"TM16 Pay Day",type:"TM",description:"Teaches Pay Day to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:6}},
  {id:58,name:"TM17 Submission",type:"TM",description:"Teaches Submission to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:66}},
  {id:59,name:"TM18 Counter",type:"TM",description:"Teaches Counter to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:68}},
  {id:60,name:"TM19 Seismic Toss",type:"TM",description:"Teaches Seismic Toss to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:69}},
  {id:61,name:"TM20 Rage",type:"TM",description:"Teaches Rage to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:99}},
  {id:62,name:"TM21 Mega Drain",type:"TM",description:"Teaches Mega Drain to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:72}},
  {id:63,name:"TM22 Solar Beam",type:"TM",description:"Teaches Solar Beam to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:76}},
  {id:64,name:"TM23 Dragon Rage",type:"TM",description:"Teaches Dragon Rage to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:82}},
  {id:65,name:"TM24 Thunderbolt",type:"TM",description:"Teaches Thunderbolt to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:85}},
  {id:66,name:"TM25 Thunder",type:"TM",description:"Teaches Thunder to a compatible Pokémon.",price:5500,sellPrice:2750,effect:{type:"tm",moveId:87}},
  {id:67,name:"TM26 Earthquake",type:"TM",description:"Teaches Earthquake to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:89}},
  {id:68,name:"TM27 Fissure",type:"TM",description:"Teaches Fissure to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:90}},
  {id:69,name:"TM28 Dig",type:"TM",description:"Teaches Dig to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:91}},
  {id:70,name:"TM29 Psychic",type:"TM",description:"Teaches Psychic to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:94}},
  {id:71,name:"TM30 Teleport",type:"TM",description:"Teaches Teleport to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:100}},
  {id:72,name:"TM31 Mimic",type:"TM",description:"Teaches Mimic to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:102}},
  {id:73,name:"TM32 Double Team",type:"TM",description:"Teaches Double Team to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:104}},
  {id:74,name:"TM33 Reflect",type:"TM",description:"Teaches Reflect to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:115}},
  {id:75,name:"TM34 Bide",type:"TM",description:"Teaches Bide to a compatible Pokémon.",price:2000,sellPrice:1000,effect:{type:"tm",moveId:117}},
  {id:76,name:"TM35 Metronome",type:"TM",description:"Teaches Metronome to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:118}},
  {id:77,name:"TM36 Self-Destruct",type:"TM",description:"Teaches Self-Destruct to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:120}},
  {id:78,name:"TM37 Egg Bomb",type:"TM",description:"Teaches Egg Bomb to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:121}},
  {id:79,name:"TM38 Fire Blast",type:"TM",description:"Teaches Fire Blast to a compatible Pokémon.",price:5500,sellPrice:2750,effect:{type:"tm",moveId:126}},
  {id:80,name:"TM39 Swift",type:"TM",description:"Teaches Swift to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:129}},
  {id:81,name:"TM40 Skull Bash",type:"TM",description:"Teaches Skull Bash to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:130}},
  {id:82,name:"TM41 Soft-Boiled",type:"TM",description:"Teaches Soft-Boiled to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:135}},
  {id:83,name:"TM42 Dream Eater",type:"TM",description:"Teaches Dream Eater to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:138}},
  {id:84,name:"TM43 Sky Attack",type:"TM",description:"Teaches Sky Attack to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:143}},
  {id:85,name:"TM44 Rest",type:"TM",description:"Teaches Rest to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:156}},
  {id:86,name:"TM45 Thunder Wave",type:"TM",description:"Teaches Thunder Wave to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:86}},
  {id:87,name:"TM46 Psywave",type:"TM",description:"Teaches Psywave to a compatible Pokémon.",price:3000,sellPrice:1500,effect:{type:"tm",moveId:149}},
  {id:88,name:"TM47 Explosion",type:"TM",description:"Teaches Explosion to a compatible Pokémon.",price:5000,sellPrice:2500,effect:{type:"tm",moveId:153}},
  {id:89,name:"TM48 Rock Slide",type:"TM",description:"Teaches Rock Slide to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:157}},
  {id:90,name:"TM49 Tri Attack",type:"TM",description:"Teaches Tri Attack to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:161}},
  {id:91,name:"TM50 Substitute",type:"TM",description:"Teaches Substitute to a compatible Pokémon.",price:4000,sellPrice:2000,effect:{type:"tm",moveId:0}}
];

export const getItemById = (id: number) => GEN1_ITEMS.find(i => i.id === id);
export const getItemByName = (name: string) => GEN1_ITEMS.find(i => i.name.toLowerCase() === name.toLowerCase());
