
class PlayerUtils {}

/* Get a player's allegiance for display. */
PlayerUtils.computeAllegiance = function(player) {
	if (player.allegiance == 'resistance') {
	  return 'Resistance';
	} else if (player.allegiance == 'horde') {
	  return 'Horde';
	} else {
	  return player.allegiance;
	}
};
