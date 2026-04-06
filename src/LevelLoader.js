function nextDay() {
  // Trigger CSS fade effect
  document.body.style.backgroundColor = "black";

  setTimeout(() => {
    if (currentDay === "day1") currentDay = "day3";
    else if (currentDay === "day3") currentDay = "day5";

    player.x = 100; // Reset player to bedroom [cite: 3]
    document.body.style.backgroundColor = "#EBD5B3";
    updateUI();
  }, 1000);
}
