class WorldLevel {
  constructor() {
    this.currentDay = 1; // 1 = Day 1, 3 = Day 3
    this.currentRoom = "Bedroom";
    this.sequenceStep = 0;
  }

  advanceSequence() {
    this.sequenceStep++;
  }

  changeRoom(newRoom) {
    this.currentRoom = newRoom;
  }

  // 核心功能：重置到新的一天
  resetForNextDay(dayNumber) {
    this.currentDay = dayNumber;
    this.currentRoom = "Bedroom";
    this.sequenceStep = 0; // 从头开始起床
  }
}
