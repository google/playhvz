
class PlayerUtils {}

/* Get a player's allegiance for display. */
PlayerUtils.computeAllegiance = function(player) {
  assert(player);
	if (player.allegiance == 'resistance') {
	  return 'Resistance';
	} else if (player.allegiance == 'horde') {
	  return 'Horde';
	} else {
	  return player.allegiance;
	}
};

PlayerUtils.getDefaultProfilePic = function(name) {
	if (!name) {
		return '';
	}

	let defaultProfilePics = [
		'https://goo.gl/WMMjhe',
		'https://goo.gl/haNJsE',
		'https://goo.gl/rRHGus',
		'https://goo.gl/RfK87d',
		'https://goo.gl/0WvZKs',
		'https://goo.gl/aEI2Uj',
		'https://goo.gl/tJ0HSe',
		'https://goo.gl/bbJGzW',
		'https://goo.gl/HcmpLi',
		'https://goo.gl/pEjp5M',
		'https://goo.gl/kNH2ov',
	];

	let hash = Math.abs(PlayerUtils.hashName(name));
	let index = hash % defaultProfilePics.length;
	let profilePicUrl = defaultProfilePics[index];
	return profilePicUrl;
};

	
PlayerUtils.hashName = function(name) {
    var hash = 0;
    if (name.length == 0) return hash;
    for (i = 0; i < name.length; i++) {
        char = name.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
