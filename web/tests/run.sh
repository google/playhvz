echo 'Running creategame test!'
python creategame.py $1 $2 $3
echo 'Running joingame test!'
python joingame.py $1 $2 $3
echo 'Running infect test!'
python infect.py $1 $2 $3
echo 'Running declare test!'
python declare.py $1 $2 $3
echo 'Running chat test!'
python chat.py $1 $2 $3
echo 'Running modify game test!'
python modifygame.py $1 $2 $3
