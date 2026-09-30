export interface PlantEquipmentRecord {
  id: string;
  objectId: string;
  description: string;
  level: "Equipment";
  equipmentType: string;
  serialNumber: string;
  manufacturedDate: string;
  installationDate: string;
  pictureNumber: number;
  machineId?: string;
}

export interface ProductionLineRecord {
  id: string;
  objectId: string;
  name: string;
  equipment: PlantEquipmentRecord[];
}

export interface FurnaceRecord {
  id: string;
  objectId: string;
  name: string;
  lines: ProductionLineRecord[];
}

export interface PlantRecord {
  id: string;
  objectId?: string;
  accountId: string;
  name: string;
  location: string;
  coordinates: { lat: number; lon: number };
  furnaces: FurnaceRecord[];
}

const emptyEquipment: PlantEquipmentRecord[] = [];

export const plants: PlantRecord[] = [
  {
    id: "plant-visy-brisbane",
    objectId: "11061026",
    accountId: "account-northstar",
    name: "Visy Glass Brisbane",
    location: "Brisbane, Australia",
    coordinates: { lat: -27.47, lon: 153.03 },
    furnaces: [
      { id: "furnace-brisbane-qg1", objectId: "11061026-FQG1", name: "Brisbane Furnace QG1", lines: [] },
      {
        id: "furnace-brisbane-qg3",
        objectId: "11061026-FQG3",
        name: "Brisbane Furnace QG3",
        lines: [
          { id: "line-brisbane-qg31", objectId: "11061026-LQG31", name: "Brisbane Line QG31", equipment: emptyEquipment },
          { id: "line-brisbane-qg32", objectId: "11061026-LQG32", name: "Brisbane Line QG32", equipment: emptyEquipment },
          {
            id: "line-brisbane-qg33",
            objectId: "11061026-LQG33",
            name: "Brisbane Line QG33",
            equipment: [
              {
                id: "equipment-ais-10-section",
                objectId: "210-910-2-2M0019-QG33",
                description: "AIS 10 Section 6 1/4\"",
                level: "Equipment",
                equipmentType: "Machine",
                serialNumber: "BEG000216948",
                manufacturedDate: "7/21/2021",
                installationDate: "7/22/2021",
                pictureNumber: 1,
                machineId: "machine-brisbane-ais-10",
              },
              {
                id: "equipment-visy-feeder",
                objectId: "555-100-8-2M0019-QG33",
                description: "555 FEEDER VISY 2M0019-QG33",
                level: "Equipment",
                equipmentType: "Gob Forming",
                serialNumber: "BEG000220004",
                manufacturedDate: "7/13/2021",
                installationDate: "7/14/2021",
                pictureNumber: 9,
              },
              {
                id: "equipment-blank-radar",
                objectId: "604-101-1-2M0026-LQG33",
                description: "BlankRadar Visy Glass Line QG33",
                level: "Equipment",
                equipmentType: "Blank Radar",
                serialNumber: "BEG000227910",
                manufacturedDate: "12/22/2021",
                installationDate: "12/23/2021",
                pictureNumber: 10,
              },
              {
                id: "equipment-flex-radar",
                objectId: "604-106-1-2M0026-LQG33",
                description: "FlexRadar Visy Glass Line QG33",
                level: "Equipment",
                equipmentType: "Flex Radar",
                serialNumber: "BEG000228359",
                manufacturedDate: "1/5/2022",
                installationDate: "1/6/2022",
                pictureNumber: 11,
              },
              {
                id: "equipment-flex-robot",
                objectId: "607-101-45-2S0023",
                description: "FlexRobot Visy Glass Brisbane",
                level: "Equipment",
                equipmentType: "Robots",
                serialNumber: "BEG000238673",
                manufacturedDate: "8/15/2022",
                installationDate: "8/16/2022",
                pictureNumber: 12,
              },
              {
                id: "equipment-flexis",
                objectId: "601-1-3-2M0019-QG33",
                description: "FLEXIS 10S VISY 2M0019-QG33",
                level: "Equipment",
                equipmentType: "Controls",
                serialNumber: "BEG000221180",
                manufacturedDate: "7/14/2021",
                installationDate: "7/15/2021",
                pictureNumber: 13,
              },
              {
                id: "equipment-gob-radar",
                objectId: "608-101-1-2M0026-LQG33",
                description: "GobRadar 251 Visy Glass Line QG33",
                level: "Equipment",
                equipmentType: "Gob Radar",
                serialNumber: "BEG000223495",
                manufacturedDate: "9/1/2021",
                installationDate: "9/2/2021",
                pictureNumber: 14,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "plant-visy-adelaide",
    accountId: "account-northstar",
    name: "Visy Glass Adelaide",
    location: "Adelaide, Australia",
    coordinates: { lat: -34.93, lon: 138.6 },
    furnaces: [],
  },
];