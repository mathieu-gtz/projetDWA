create table Player(
    nickname varchar(30),
    pswrd varchar(30),
    age number,
    gender char(1),
    constraint pk_Player primary key (nickname)
)

create table Charac(
    idC number,
    nameC varchar(30),
    caracteristic varchar(30),
    constraint pk_Charac primary key (idC)
)

create table Grid(
    idGrid number,
    nameGrid varchar(40),
    constraint pk_Grid primary key(idGrid)
)

create table Game(
    idG number,
    winner varchar(30),
    GameDate date,
    player1 varchar(30),
    player2 varchar(30),
    score1 number,
    score2 number,
    grid number,
    constraint pk_Game primary key (idG),
    constraint fk_Player_Game1 foreign key (winner) references Player,
    constraint fk_Player_Game2 foreign key (player1) references Player,
    constraint fk_Player_Game3 foreign key (player2) references Player,
    constraint fk_Grid_Game foreign key (grid) references Grid
)

create table LogQuestions(
    idQ number,
    nickname varchar(30),
    idG number,
    contentQ varchar(200),
    constraint pk_LogQuestion primary key (idQ),
    constraint fk_Player_LogQuestions foreign key (nickname) references Player,
    constraint fk_Game_LogQuestions foreign key (idG) references Game
)

create table Membership(
    idGrid number,
    idC number,
    constraint pk_Membership primary key(idGrid, idC),
    constraint fk_Grid_Membership foreign key (idGrid) references Grid,
    constraint fk_Charac_Membership foreign key (idC) references Charac
)
