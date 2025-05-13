export interface Grid {
  idGrid: number;
  nameGrid: string;
  characs: Character[];
}

export interface Character {
  idC: number;
  name: string;
  caracteristic: string;
  grids: number[];
}