from optparse import OptionParser
from driver import WholeDriver

def MakeDriver(user="zella", page="", populate=True):
	parser = OptionParser()
	parser.add_option("--url", dest="client_url", help="Url of the web server", default="localhost:5000")
	parser.add_option("--password", dest="password", help="Password for the fake users, if using remote")
	parser.add_option("-r", action="store_true", dest="use_remote", help="Hit an external backend/firebase instead of the in-memory fake.")
	parser.add_option("-m", action="store_true", dest="is_mobile", help="Test as if using a mobile device.")
	parser.add_option("-d", action="store_true", dest="use_dashboards", help="Test dashboard widgets instead of pages.")
	(options, args) = parser.parse_args()

	if options.use_remote:
		assert options.password

	return WholeDriver(
	    options.client_url,
	    options.is_mobile,
	    options.use_remote,
	    options.use_dashboards,
	    user,
	    options.password,
	    page,
	    populate)