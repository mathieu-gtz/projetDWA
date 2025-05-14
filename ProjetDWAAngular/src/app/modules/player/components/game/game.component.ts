import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebSocketService } from '../../services/web-socket.service';
import { StorageService } from '../../../../auth/services/storage/storage.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { GameRules } from '../../models/GameRules';
import { GameService } from '../../services/game.service';
import { Game } from '../../models/Game';
import { GameMessage } from '../../models/GameMessage';
import { Character, Grid } from '../../models/Grid';
import { GuessDialogComponent } from '../guess-dialog/guess-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import seedrandom from 'seedrandom';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ResultDialogComponent } from '../result-dialog/result-dialog.component';
import { Router } from '@angular/router';
import {forkJoin, map} from 'rxjs';
import { CharacService } from '../../services/charac.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment.prod';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  imports: [
    MatGridListModule,
    MatCardModule,
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSelectModule,
  ],
  standalone: true
})
export class GameComponent implements OnInit {
  game: Game;
  gameRules: GameRules;
  grid: Grid;
  characters: Character[] = [];
  currentPlayer: string;
  isCurrentPlayerTurn: boolean = false;
  canAskQuestion: boolean = true;
  waitingForAnswer: boolean = false;
  waitingForGuess: boolean = false;
  currentQuestion: string = '';
  messages: GameMessage[] = [];
  currentChatMessage: string = '';
  selectedCharacterToGuess: Character | null = null;
  mySelectedCharacter: Character | null = null;
  gameStarted: boolean = false;
  currentRound: number = 1;
  characterImages: Map<number, string> = new Map();
  canAskMoreQuestions: boolean = true;
  player1TurnsUsed: number = 0;
  player2TurnsUsed: number = 0;

  bothPlayersMustGuess: boolean = false;
  hasGuessedThisRound: { player1: boolean; player2: boolean } = {
    player1: false,
    player2: false
  };
  private tempGuessResults: { player1Result: boolean | null; player2Result: boolean | null } = {
    player1Result: null,
    player2Result: null
  };


  constructor(
    private route: ActivatedRoute,
    private webSocketService: WebSocketService,
    private dialog: MatDialog,
    private gameService: GameService,
    private router: Router,
    private characService: CharacService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
      const gameId = this.route.snapshot.paramMap.get('id');
      if (gameId) {
          this.loadGame(gameId);
          this.initializeWebSocketConnection(gameId);
          setTimeout(() => {
              this.synchronizeRound();
          }, 1500);
      }
  }

private initializeWebSocketConnection(gameId: string) {
    this.webSocketService.getGameMessages(gameId).subscribe(message => {
        this.messages.push(message);

        switch(message.type) {
            case 'QUESTION':
                if (!this.isCurrentPlayerTurn) {
                    this.waitingForAnswer = true;
                }
                this.canAskQuestion = false;
                break;

            case 'ANSWER':
                if (this.isCurrentPlayerTurn) {
                    this.waitingForGuess = true;
                    this.canAskQuestion = false;

                    if (StorageService.getUser().nickname === this.game.player1) {
                        this.player1TurnsUsed++;
                    } else {
                        this.player2TurnsUsed++;
                    }

                    // Envoyer la mise à jour des tours
                    this.webSocketService.sendGameMessage({
                        gameId: this.game.idG,
                        type: 'TURN_UPDATE',
                        content: JSON.stringify({
                            player1TurnsUsed: this.player1TurnsUsed,
                            player2TurnsUsed: this.player2TurnsUsed
                        }),
                        sender: StorageService.getUser().nickname
                    });

                    const bothPlayersUsedAllTurns =
                        this.player1TurnsUsed >= this.gameRules.maxTurnsPerRound &&
                        this.player2TurnsUsed >= this.gameRules.maxTurnsPerRound;

                    if (bothPlayersUsedAllTurns) {
                        this.canAskMoreQuestions = false;
                        this.forceBothPlayersToGuess();
                    }
                } else {
                    this.waitingForAnswer = false;
                }
                break;

            case 'TURN_UPDATE':
                if (message.sender !== StorageService.getUser().nickname) {
                    try {
                        const turns = JSON.parse(message.content);
                        this.player1TurnsUsed = turns.player1TurnsUsed;
                        this.player2TurnsUsed = turns.player2TurnsUsed;

                        if (this.player1TurnsUsed >= this.gameRules.maxTurnsPerRound &&
                            this.player2TurnsUsed >= this.gameRules.maxTurnsPerRound) {
                            if (!this.bothPlayersMustGuess) {
                                this.forceBothPlayersToGuess();
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing turn update:', error);
                    }
                }
                break;

            case 'SYSTEM':
                if (message.content === 'PASS_TURN') {
                    this.switchTurn();
                } else if (message.content === 'INCREMENT_ROUND') {
                    // Gestion de l'incrémentation de la manche
                    this.handleSystemMessage(message);
                } else if (message.content.startsWith('ROUND_')) {
                    // Ne traiter que les messages de l'autre joueur
                    if (message.sender !== StorageService.getUser().nickname) {
                        const newRound = parseInt(message.content.split('_')[1]);
                        if (!isNaN(newRound)) {
                            console.log('Setting round from message:', {
                                oldRound: this.currentRound,
                                newRound: newRound,
                                sender: message.sender
                            });
                            this.currentRound = newRound;
                        }
                    }
                }
                break;

            case 'SELECTED_CHARACTER':
                if (message.sender !== StorageService.getUser().nickname) {
                    const characterId = parseInt(message.content);
                    this.selectedCharacterToGuess = this.characters.find(c => c.idC === characterId) || null;
                    console.log('Character to guess received:', {
                        id: characterId,
                        character: this.selectedCharacterToGuess?.name,
                        sender: message.sender
                    });
                }
                break;

            case 'GUESS_RESULT':
                if (message.sender !== StorageService.getUser().nickname) {
                    try {
                        const guessData = JSON.parse(message.content);
                        const isPlayer1Guess = guessData.player === this.game.player1;

                        if (isPlayer1Guess) {
                            this.hasGuessedThisRound.player1 = true;
                            this.tempGuessResults.player1Result = guessData.isCorrect;
                        } else {
                            this.hasGuessedThisRound.player2 = true;
                            this.tempGuessResults.player2Result = guessData.isCorrect;
                        }

                        const isCurrentPlayer1 = this.game.player1 === StorageService.getUser().nickname;
                        if ((isCurrentPlayer1 && this.hasGuessedThisRound.player1) ||
                            (!isCurrentPlayer1 && this.hasGuessedThisRound.player2)) {
                            this.showResultDialog(guessData.isCorrect, guessData.character.name);
                        }
                    } catch (error) {
                        console.error('Error parsing guess result:', error);
                    }
                }
                break;

            case 'SCORE_UPDATE':
                if (message.sender !== StorageService.getUser().nickname) {
                    try {
                        const scores = JSON.parse(message.content);
                        this.game.score1 = scores.score1;
                        this.game.score2 = scores.score2;
                        console.log('Score updated from WebSocket:', scores);
                    } catch (error) {
                        console.error('Error parsing score update:', error);
                    }
                }
                break;
        }
    });
}

    private initializeGame(gameData: Game) {

        console.log('Initialisation de la partie:', gameData);

        this.game = gameData;

        if (gameData.gameRules) {
            console.log('Des règles ont été trouvées:', gameData.gameRules);
            this.gameRules = {
                maxRounds: gameData.gameRules.maxRounds,
                useRandomSubgrid: gameData.gameRules.useRandomSubgrid,
                subgridSize: gameData.gameRules.subgridSize,
                maxQuestionsPerTurn: gameData.gameRules.maxQuestionsPerTurn,
                maxTurnsPerRound: gameData.gameRules.maxTurnsPerRound
            };
        } else {
            console.warn('Pas de règles trouvées, utilisation des valeurs par défaut');
            this.gameRules = {
                maxRounds: 10,
                useRandomSubgrid: false,
                subgridSize: 24,
                maxQuestionsPerTurn: 1,
                maxTurnsPerRound: 5
            };
        }
        console.log('Règles de jeu:', this.gameRules);

        const currentPlayer = StorageService.getUser().nickname;
        this.isCurrentPlayerTurn = currentPlayer === gameData.player1;
        this.canAskQuestion = this.isCurrentPlayerTurn;

        const isGameOver = this.currentRound >= this.gameRules.maxRounds;

        if (!this.mySelectedCharacter && !this.selectedCharacterToGuess) {
            console.log('Opening character selection for new game');
            setTimeout(() => {
                this.openCharacterSelectionDialog();
            }, 1000);
        }
    }


  private loadGame(gameId: string) {
      this.gameService.getGame(gameId).subscribe({
          next: (gameData) => {
              console.log('Full game data received:', gameData);

              if (!gameData.gameRules) {
                  gameData.gameRules = {
                      maxRounds: 10,
                      useRandomSubgrid: false,
                      subgridSize: 24,
                      maxQuestionsPerTurn: 1,
                      maxTurnsPerRound: 5
                  };

                  this.gameService.updateGameRules(gameId, gameData.gameRules).subscribe(
                      updatedGame => {
                          console.log('Game updated with default rules:', updatedGame);
                          this.initializeGame(updatedGame);
                      }
                  );
              } else {
                  this.initializeGame(gameData);
              }

              this.loadGameGrid(gameData.grid);
          },
          error: (error) => {
              console.error('Error loading game:', error);
          }
      });
  }


  private loadGameGrid(gridId: number) {
  return this.gameService.getGridById(gridId).subscribe({
    next: (gridData) => {
      console.log('Grid loaded:', gridData);
      this.grid = gridData;
      this.characters = gridData.characs;

      this.preloadCharacterImages();

      if (this.gameRules?.useRandomSubgrid) {
        this.selectRandomSubgrid(this.gameRules.subgridSize);
      }
    },
    error: (error) => {
      console.error('Error loading grid:', error);
    }
  });
}

    private selectRandomSubgrid(size: number) {
        if (!this.characters?.length || size >= this.characters.length) {
            console.log('Invalid subgrid configuration:', {
                currentSize: this.characters?.length,
                requestedSize: size
            });
            return;
        }

        const sortedCharacters = [...this.characters].sort((a, b) => a.idC - b.idC);

        const seed = this.game.idG.toString();
        console.log('Using seed for shuffling:', seed);
        const rng = seedrandom(seed);

        const pairs = sortedCharacters.map((char, index) => ({
            char,
            rand: rng()
        }));

        const shuffled = pairs
            .sort((a, b) => a.rand - b.rand)
            .slice(0, size)
            .map(pair => pair.char)
            .sort((a, b) => a.idC - b.idC);

        console.log('Selected subgrid:', {
            originalSize: this.characters.length,
            newSize: shuffled.length,
            seed: seed,
            firstCharacterId: shuffled[0]?.idC,
            allCharacterIds: shuffled.map(c => c.idC)
        });

        this.characters = shuffled;
    }

    processMessage(message: string) {
        if (!message?.trim()) return;

        const isQuestion = message.trim().startsWith('?');

        if (isQuestion) {
            const isPlayer1 = this.game.player1 === StorageService.getUser().nickname;
            const turnsUsed = isPlayer1 ? this.player1TurnsUsed : this.player2TurnsUsed;

            if (!this.canAskQuestion || !this.isCurrentPlayerTurn ||
                turnsUsed >= this.gameRules.maxTurnsPerRound) {
                console.log('Cannot ask question:', {
                    canAskQuestion: this.canAskQuestion,
                    isCurrentPlayerTurn: this.isCurrentPlayerTurn,
                    turnsUsed: turnsUsed,
                    maxTurns: this.gameRules.maxTurnsPerRound,
                    player: StorageService.getUser().nickname
                });
                return;
            }

            this.webSocketService.sendGameMessage({
                gameId: this.game.idG,
                sender: StorageService.getUser().nickname,
                content: message,
                type: 'QUESTION'
            });

            this.canAskQuestion = false;
            this.waitingForAnswer = true;
        } else {
            // Message normal de chat
            this.webSocketService.sendGameMessage({
                gameId: this.game.idG,
                sender: StorageService.getUser().nickname,
                content: message,
                type: 'CHAT'
            });
        }

        this.currentChatMessage = '';
    }


    private switchTurn() {
        this.isCurrentPlayerTurn = !this.isCurrentPlayerTurn;
        this.canAskQuestion = this.isCurrentPlayerTurn;
        this.waitingForAnswer = false;
        this.waitingForGuess = false;

        console.log('Turn switched:', {
            isCurrentPlayerTurn: this.isCurrentPlayerTurn,
            canAskQuestion: this.canAskQuestion,
            player: StorageService.getUser().nickname,
            player1TurnsUsed: this.player1TurnsUsed,
            player2TurnsUsed: this.player2TurnsUsed,
            maxTurns: this.gameRules.maxTurnsPerRound
        });
    }

    answerQuestion(answer: boolean) {
        if (!this.waitingForAnswer || this.isCurrentPlayerTurn) return;

        this.webSocketService.sendGameMessage({
            gameId: this.game.idG,
            sender: StorageService.getUser().nickname,
            content: answer ? 'OUI' : 'NON',
            type: 'ANSWER'
        });

        this.waitingForAnswer = false;
    }

    private openGuessDialog() {
        const dialogRef = this.dialog.open(GuessDialogComponent, {
            width: '300px',
            data: {
                characters: this.characters,
                title: 'Devinez le personnage'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.handleGuess(result.character);
            } else {
                this.makeGuess(false);
            }
        });
    }


    private handleGuess(guessedCharacter: Character) {
        const isCorrectGuess = guessedCharacter.idC === this.selectedCharacterToGuess?.idC;
        const isPlayer1 = this.game.player1 === StorageService.getUser().nickname;

        if (isPlayer1) {
            this.hasGuessedThisRound.player1 = true;
            this.tempGuessResults.player1Result = isCorrectGuess;
        } else {
            this.hasGuessedThisRound.player2 = true;
            this.tempGuessResults.player2Result = isCorrectGuess;
        }

        this.webSocketService.sendGameMessage({
            gameId: this.game.idG,
            type: 'GUESS_RESULT',
            content: JSON.stringify({
                isCorrect: isCorrectGuess,
                character: guessedCharacter,
                player: StorageService.getUser().nickname
            }),
            sender: StorageService.getUser().nickname
        });

        const pointForPlayer1 = (isPlayer1 && isCorrectGuess) || (!isPlayer1 && !isCorrectGuess);

        this.gameService.updateScore(this.game.idG, pointForPlayer1).subscribe(updatedGame => {
            if (updatedGame) {
                this.game = updatedGame;
                this.webSocketService.sendGameMessage({
                    gameId: this.game.idG,
                    type: 'SCORE_UPDATE',
                    content: JSON.stringify({
                        score1: updatedGame.score1,
                        score2: updatedGame.score2
                    }),
                    sender: StorageService.getUser().nickname
                });

                this.showResultDialog(isCorrectGuess, guessedCharacter.name);

                if (isPlayer1 && this.hasGuessedThisRound.player1 && this.hasGuessedThisRound.player2) {
                    setTimeout(() => {
                        this.webSocketService.sendGameMessage({
                            gameId: this.game.idG,
                            type: 'SYSTEM',
                            content: 'INCREMENT_ROUND',
                            sender: StorageService.getUser().nickname
                        });
                    }, 1500);
                }
            }
        });
    }

    private showResultDialog(isCorrectGuess: boolean, characterName: string) {
        const isGameOver = this.gameRules?.maxRounds !== -1 &&
                        this.currentRound >= (this.gameRules?.maxRounds || 10);

        const dialogRef = this.dialog.open(ResultDialogComponent, {
            width: '300px',
            data: {
                title: isCorrectGuess ? 'Correct !' : 'Faux !',
                content: this.getResultMessage(isCorrectGuess, characterName, isGameOver)
            }
        });

        dialogRef.afterClosed().subscribe(() => {
            if (isGameOver) {
                this.handleGameOver();
            }
        });
    }



    private forceBothPlayersToGuess() {
        if (this.bothPlayersMustGuess) return;

        this.bothPlayersMustGuess = true;
        this.canAskMoreQuestions = false;

        this.webSocketService.sendGameMessage({
            gameId: this.game.idG,
            type: 'SYSTEM',
            content: 'FORCE_GUESS',
            sender: StorageService.getUser().nickname
        });

        const isPlayer1 = this.game.player1 === StorageService.getUser().nickname;
        if ((isPlayer1 && !this.hasGuessedThisRound.player1) ||
            (!isPlayer1 && !this.hasGuessedThisRound.player2)) {
            this.waitingForGuess = true;
            this.snackBar.open('Les deux joueurs doivent deviner !', 'OK', {
                duration: 3000
            });
            setTimeout(() => {
                this.openGuessDialog();
            }, 1000);
        }
    }

    private handleSystemMessage(message: GameMessage) {
        if (message.content === 'INCREMENT_ROUND') {
            this.currentRound += 1;
            this.resetRoundState();
            this.canAskQuestion = this.isCurrentPlayerTurn;
            this.selectedCharacterToGuess = null;
            this.mySelectedCharacter = null;

            if (this.characters && this.characters.length > 0) {
                setTimeout(() => {
                    this.openCharacterSelectionDialog();
                }, 1000);
            }
        } else if (message.content === 'FORCE_GUESS') {
            if (this.bothPlayersMustGuess) return;

            this.bothPlayersMustGuess = true;
            this.canAskMoreQuestions = false;

            const isPlayer1 = this.game.player1 === StorageService.getUser().nickname;
            if ((isPlayer1 && !this.hasGuessedThisRound.player1) ||
                (!isPlayer1 && !this.hasGuessedThisRound.player2)) {
                this.waitingForGuess = true;
                this.snackBar.open('Les deux joueurs doivent deviner !', 'OK', {
                    duration: 3000
                });
                setTimeout(() => {
                    this.openGuessDialog();
                }, 1000);
            }
        }
    }

    private resetRoundState() {
        this.player1TurnsUsed = 0;
        this.player2TurnsUsed = 0;
        this.canAskMoreQuestions = true;
        this.bothPlayersMustGuess = false;
        this.hasGuessedThisRound = {
            player1: false,
            player2: false
        };
        this.tempGuessResults = {
            player1Result: null,
            player2Result: null
        };
        this.waitingForGuess = false;
        this.waitingForAnswer = false;
    }

    makeGuess(wantToGuess: boolean) {
        if (!this.waitingForGuess) return;

        if (wantToGuess) {
            this.openGuessDialog();
        } else {
            // Passer le tour au lieu de passer à la manche suivante
            this.webSocketService.sendGameMessage({
                gameId: this.game.idG,
                type: 'SYSTEM',
                content: 'PASS_TURN',
                sender: StorageService.getUser().nickname
            });
            this.waitingForGuess = false;
            this.canAskQuestion = false;
        }
    }

    private openCharacterSelectionDialog() {
        if (!this.characters || this.characters.length === 0) {
            console.error('No characters available for selection');
            return;
        }

        console.log('Opening character selection dialog', {
            charactersAvailable: this.characters.length,
            currentPlayer: StorageService.getUser().nickname
        });

        const dialogRef = this.dialog.open(GuessDialogComponent, {
            width: '300px',
            data: {
                characters: this.characters,
                title: 'Choisissez votre personnage que l\'adversaire devra deviner'
            },
            disableClose: true
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.character) {
                console.log('Character selected:', result.character);
                this.mySelectedCharacter = result.character;
                this.webSocketService.sendGameMessage({
                    gameId: this.game.idG,
                    type: 'SELECTED_CHARACTER',
                    content: result.character.idC.toString(),
                    sender: StorageService.getUser().nickname
                });
                this.gameStarted = true;
            } else {
                console.error('No character was selected');
                // Réouvrir le dialogue si aucun personnage n'a été sélectionné
                setTimeout(() => this.openCharacterSelectionDialog(), 500);
            }
        });
    }

    private getResultMessage(isCorrectGuess: boolean, characterName: string, isGameOver: boolean): string {
        if (isGameOver) {
            const winner = this.game.score1 > this.game.score2 ? this.game.player1 : this.game.player2;
            return `Fin de la partie ! ${winner} remporte la victoire avec un score de ${Math.max(this.game.score1, this.game.score2)} - ${Math.min(this.game.score1, this.game.score2)}`;
        }

        // Pour les manches infinies, on affiche juste le numéro de la manche
        const roundInfo = this.gameRules.maxRounds === -1
            ? `Manche ${this.currentRound}`
            : `Manche ${this.currentRound}/${this.gameRules.maxRounds}`;

        return isCorrectGuess
            ? `${roundInfo} terminée ! Vous avez trouvé le bon personnage !`
            : `${roundInfo} - Non, ce n'était pas ${characterName}... Point pour l'adversaire !`;
    }

  private handleGameOver() {
      localStorage.removeItem(`game_${this.game.idG}_round`);

      const winner = this.game.score1 > this.game.score2 ? this.game.player1 : this.game.player2;
      this.gameService.endGame(this.game.idG, winner).subscribe({
          next: () => {
              this.router.navigate(['/games']);
          },
          error: (error) => console.error('Error ending game:', error)
      });
  }


  private synchronizeRound() {
    this.webSocketService.sendGameMessage({
        gameId: this.game.idG,
        type: 'SYSTEM',
        content: `ROUND_${this.currentRound}`
    });
  }

    getCharacterImageUrl(character: any): string {
    const characterId = typeof character === 'object' ? character.idC : character;
    return this.characterImages.get(characterId) ||
        `${environment.apiUrl}/images/default.png`;
    }


    preloadCharacterImages(): void {
    const imageRequests = this.characters.map(character => {
        return this.characService.getCharacImageUrl(character.idC).pipe(
        map(imagePath => {
            return { id: character.idC, path: imagePath };
        })
        );
    });

    forkJoin(imageRequests).subscribe({
        next: (results) => {
        results.forEach(result => {
            // Utiliser l'URL de l'API de production
            this.characterImages.set(result.id, `${environment.apiUrl}${result.path}`);
        });
        this.characters = [...this.characters];
        },
        error: (error) => {
        console.error('Erreur lors du chargement des images', error);
        }
    });
    }



}
