require 'sinatra/base'

class Lord < Sinatra::Base

	get "/" do
		
		erb :index
		
	end
	
	run!
	
end