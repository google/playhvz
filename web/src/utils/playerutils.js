
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
		'https://goo.gl/gBQ1Kx',
		'https://goo.gl/ExqDyF',
		'https://goo.gl/Aj3pPs',
		'https://goo.gl/TjCmuh',
		'https://goo.gl/zxDxMU',
		'https://goo.gl/tGCRrj',
		'https://goo.gl/ogxpAV',
		'https://goo.gl/QNwVag',
		'https://goo.gl/4rC7x6',
		'https://goo.gl/WpYtzt',
		'https://goo.gl/eNMPd1',
		'https://goo.gl/dEDG56',
		'https://goo.gl/o12QaU',
		'https://goo.gl/T3HFne',
		'https://goo.gl/8aRqJ4',
		'https://goo.gl/dqPjE2',
		'https://goo.gl/cHqQwU',
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
