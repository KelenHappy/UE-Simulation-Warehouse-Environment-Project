export const warehouseGrid = {
  width: 5,
  depth: 10,
  height: 5
}

export const unloadBays = [
  { cells: ['0-0', '1-0'], protrudeSteps: 1 },
  { cells: ['3-0', '4-0'], protrudeSteps: 1 }
]

export const unloadAreaCells = new Set(unloadBays.flatMap((bay) => bay.cells))

export const getMaxBoxId = () => {
  const totalCells = warehouseGrid.width * warehouseGrid.depth
  const unloadCellCount = unloadAreaCells.size
  const totalBoxes = totalCells * warehouseGrid.height
  return totalBoxes - unloadCellCount * warehouseGrid.height
}
