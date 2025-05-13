import { Injectable } from '@angular/core';
import {Client, IMessage} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, filter, Observable, Subject, take, merge, switchMap } from 'rxjs';
import {StorageService} from '../../../auth/services/storage/storage.service';
import { GameService } from './game.service';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { GameMessage } from '../models/GameMessage';

const WebSocketUrl = 'http://localhost:8080/ws';

interface GameStartMessage {
  gameId: number | string;
  status: string;
  event: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private gamesList = new BehaviorSubject<any[]>([]);
  private connected = false;
  private messageSubjects: Map<string, BehaviorSubject<any>> = new Map();
  private subscriptions: any[] = [];
  private onlinePlayersSubject = new BehaviorSubject<string[]>([]);
  private token: string;

  constructor(
    private gameService: GameService
  ) {
    this.initializeWebSocketConnection();
  }

initializeWebSocketConnection() {
  this.token = StorageService.getToken();
  this.client = new Client({
    webSocketFactory: () => new SockJS(WebSocketUrl),
    connectHeaders: {
      'Authorization': 'Bearer ' + this.token
    },
    debug: (str) => console.log(str)
  });

  this.client.onConnect = () => {
    console.log('Connected to WebSocket');
    this.connected = true;
    this.fetchGames();
    this.client.subscribe('/topic/games', (message) => {
      const gameUpdate = JSON.parse(message.body);
      this.updateGamesList(gameUpdate);
    });
  };

  this.subscribeToOnlineStatus();
  this.notifyOnlineStatus(true);

  this.client.onStompError = (frame) => {
    console.error('Erreur STOMP:', frame);
  };

  this.client.activate();
}


  private fetchGames() {
    fetch('http://localhost:8080/api/games/active', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + StorageService.getToken()
      }
    })
      .then(response => response.json())
      .then(games => {
        this.gamesList.next(games);
      })
      .catch(error => console.error('Erreur lors de la récupération des parties:', error));
  }


  connect(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (this.connected && this.client.connected) {
        observer.next(true);
        observer.complete();
        return;
      }

      if (!this.client.active) {
        this.client.activate();
      }

      const connectTimeout = setTimeout(() => {
        observer.error(new Error('Connection timeout'));
      }, 5000);

      const connectCallback = () => {
        clearTimeout(connectTimeout);
        this.connected = true;
        observer.next(true);
        observer.complete();
      };

      this.client.onConnect = connectCallback;
    });
  }

  getOnlinePlayers(): Observable<string[]> {
    return this.onlinePlayersSubject.asObservable();
  }


  disconnect() {

    // Déconnexion de la socket STOMP
    if (this.connected) {
      this.subscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
      this.subscriptions = [];
      this.messageSubjects.clear();

      this.client.deactivate();
      this.connected = false;
    }
  }

  private updateGamesList(gameUpdate: any) {
    const currentList = this.gamesList.value;

    if (gameUpdate.status === 'JOINED') {
      const updatedList = currentList.map(game =>
        game.idG === gameUpdate.gameId ? { ...game, player2: gameUpdate.player2Nickname } : game
      );
      this.gamesList.next(updatedList);
    }
    else if (gameUpdate.status === 'CREATED') {
      const newGame = {
        idG: gameUpdate.gameId,
        player1: gameUpdate.player1Nickname,
        player2: null,
        grid: gameUpdate.gridId,
        score1: 0,
        score2: 0,
        winner: null,
        status: 'CREATED'
      };
      this.gamesList.next([...currentList, newGame]);
    }
  }

  getGamesList() {
    return this.gamesList.asObservable();
  }

  private getMessageSubject(topic: string): BehaviorSubject<any> {
    if (!this.messageSubjects.has(topic)) {
      this.messageSubjects.set(topic, new BehaviorSubject<any>(null));
    }
    return this.messageSubjects.get(topic)!;
  }

  private subscribeToTopic(topic: string, eventType: string): Observable<any> {
    return this.connect().pipe(
      take(1),
      filter(connected => connected === true),
      filter(() => {
        const isSubscribed = this.subscriptions.some(sub =>
          sub.id && sub.id.includes(topic));

        if (!isSubscribed) {
          const subject = this.getMessageSubject(topic);
          const subscription = this.client.subscribe(topic, (message: IMessage) => {
            try {
              const data = JSON.parse(message.body);
              console.log(`Message parsed on ${topic}:`, data);

              // Instead of calling handleReadyStatusUpdate, directly handle the message
              if (eventType === 'PLAYER_READY') {
                console.log('Ready status message received:', data);
                // Pass the message directly to the subject
                subject.next(data);
              } else {
                subject.next(data);
              }
            } catch (e) {
              console.error(`Erreur lors du parsing du message sur ${topic}:`, e);
            }
          });

          this.subscriptions.push(subscription);
        }

        return true;
      })
    );
}

  getGameStartNotification(gameId: number | string): Observable<any> {
    const topic = `/topic/games/${gameId}/start`;
    this.subscribeToTopic(topic, 'GAME_STARTED');

    return this.getMessageSubject(topic).asObservable().pipe(
      filter(message => message && message.status === 'GAME_STARTED')
    );
  }

setPlayerReady(gameId: number | string, playerNickname: string, isReady: boolean): void {
  console.log('Setting player ready:', { gameId, playerNickname, isReady });

  this.connect().pipe(take(1)).subscribe(() => {
    const message = {
      gameId: gameId,
      playerNickname: playerNickname,
      ready: isReady,
      event: 'PLAYER_READY',
      type: 'PLAYER_READY',
      status: 'PLAYER_READY'  // Ajout du status
    };

    try {
      // Envoyer la mise à jour ready
      this.client.publish({
        destination: '/app/games/ready',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message)
      });

      // Demander immédiatement la mise à jour du statut global
      setTimeout(() => {
        this.requestReadyStatus(gameId);
      }, 100);

    } catch (error) {
      console.error('Error sending ready message:', error);
    }
  });
}

getPlayerReadyUpdates(gameId: number | string): Observable<any> {
  // S'abonner aux deux topics pertinents
  const readyTopic = `/topic/games/${gameId}/ready`;
  const statusTopic = `/topic/games/${gameId}/readystatus`;

  // Créer un Observable qui combine les deux types de mises à jour
  return new Observable(observer => {
    // S'abonner aux mises à jour individuelles
    const readySub = this.subscribeToTopic(readyTopic, 'PLAYER_READY').subscribe();
    const statusSub = this.subscribeToTopic(statusTopic, 'READY_STATUS').subscribe();

    // Combiner les deux sources de mises à jour
    const readyUpdates = this.getMessageSubject(readyTopic).asObservable();
    const statusUpdates = this.getMessageSubject(statusTopic).asObservable();

    // Fusionner les deux types de mises à jour
    const subscription = merge(
      readyUpdates.pipe(
        filter(msg => msg && (msg.event === 'PLAYER_READY' || msg.type === 'PLAYER_READY'))
      ),
      statusUpdates.pipe(
        filter(msg => msg && typeof msg === 'object')
      )
    ).subscribe(update => {
      console.log('Ready update received:', update);
      observer.next(update);
    });

    // Demander l'état initial
    this.requestReadyStatus(gameId);

    // Nettoyage
    return () => {
      readySub.unsubscribe();
      statusSub.unsubscribe();
      subscription.unsubscribe();
    };
  });
}

requestReadyStatus(gameId: number | string): void {
  this.connect().pipe(take(1)).subscribe(() => {
    console.log('Requesting ready status for game:', gameId);
    const message = { idG: gameId };

    try {
      this.client.publish({
        destination: '/app/games/readystatus',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Error requesting ready status:', error);
    }
  });
}

setGameStarted(gameId: number | string): void {
  console.log('Setting game as started:', gameId);

  this.connect().pipe(take(1)).subscribe(() => {
    const message: GameStartMessage = {
      gameId: gameId,
      status: 'GAME_STARTED',
      event: 'GAME_START'
    };

    console.log('Sending game start message:', message);

    this.client.publish({
      destination: '/app/games/start',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message)
    });
  });
}

  leaveLobby(gameId: number | string, playerNickname: string, isCreator: boolean): void {
    this.connect().pipe(take(1)).subscribe(() => {
      this.client.publish({
        destination: '/app/games/leave',
        headers: {},
        body: JSON.stringify({
          gameId: gameId,
          playerNickname: playerNickname,
          isCreator: isCreator,
          event: 'PLAYER_LEAVE'
        })
      });
    });
  }

  getPlayerLeaveUpdates(gameId: number | string): Observable<any> {
    const topic = `/topic/games/${gameId}/leave`;
    this.subscribeToTopic(topic, 'PLAYER_LEAVE');
      return this.getMessageSubject(topic).asObservable().pipe(
      filter(message => message && message.event === 'PLAYER_LEAVE')
    );
  }



  getPlayerJoinUpdates(gameId: number | string): Observable<any> {
    // Configuration des topics à écouter
    const topics = [
      `/topic/games/${gameId}/join`,
      `/topic/games/${gameId}`,
      `/topic/games`
    ];

    // Créer un Observable qui combine les WebSocket updates et le polling
    return new Observable(observer => {
      // WebSocket subscriptions
      const subscriptions = topics.map(topic =>
        this.subscribeToTopic(topic, 'JOINED').subscribe(message => {
          console.log(`Message reçu sur ${topic}:`, message);
          if (message &&
              (message.status === 'JOINED' || message.event === 'JOINED') &&
              message.gameId === gameId) {
            observer.next(message);
          }
        })
      );

      // Polling toutes les 2 secondes
      const pollingInterval = setInterval(() => {
        this.gameService.getGame(gameId).subscribe({
          next: (game) => {
            if (game.player2) {
              observer.next({
                status: 'JOINED',
                gameId: gameId,
                player2: game.player2
              });
            }
          },
          error: (error) => console.error('Polling error:', error)
        });
      }, 2000);

      // Cleanup function
      return () => {
        subscriptions.forEach(sub => sub.unsubscribe());
        clearInterval(pollingInterval);
      };
    });
  }

  joinGame(gameId: number, playerNickname: string): Observable<any> {
    if (!playerNickname) {
      playerNickname = StorageService.getUser().nickname;
    }
    return new Observable<any>(observer => {

      this.connect().subscribe({
        next: () => {
          try {
            console.log(`WebSocket connecté, tentative d'abonnement à /topic/games/${gameId}`);
            if (this.connected && this.client) {
              // S'abonner au topic spécifique pour recevoir la confirmation
              const gameSubscription = this.client.subscribe(`/topic/games/${gameId}`, (message) => {
                try {
                  console.log(`Message reçu sur /topic/games/${gameId}:`, message.body);
                  const response = JSON.parse(message.body);
                  if (response.status === 'JOINED') {
                    console.log('Statut JOINED reçu, confirmation de jointure');
                    gameSubscription.unsubscribe();
                    observer.next(response);
                    observer.complete();
                  }
                } catch (error) {
                  console.error('Erreur lors du parsing du message:', error);
                }
              });

              // Petit délai pour s'assurer que l'abonnement est établi
              setTimeout(() => {
                console.log(`Envoi de la demande de jointure à /app/games/${gameId}/join`);
                // Envoyer la demande pour rejoindre la partie
                this.client.publish({
                  destination: `/app/games/${gameId}/join`,
                  body: JSON.stringify({
                    player2: playerNickname
                  }),
                  headers: { 'Content-Type': 'application/json' }
                });
                console.log('Demande envoyée, en attente de réponse...');
              }, 500);

              // Ajouter un timeout
              setTimeout(() => {
                if (!observer.closed) {
                  console.error('Délai d\'attente dépassé pour rejoindre la partie');
                  gameSubscription.unsubscribe();
                  observer.error(new Error('Délai d\'attente dépassé pour rejoindre la partie'));
                }
              }, 10000);
            } else {
              console.error('WebSocket non connecté');
              observer.error(new Error('Non connecté aux WebSockets'));
            }
          } catch (error) {
            console.error('Erreur dans joinGame:', error);
            observer.error(error);
          }
        },
        error: (err) => {
          console.error('Erreur de connexion WebSocket:', err);
          observer.error(err);
        }
      });
    });
  }

  getClient() {
    return this.client;
  }


getGameMessages(gameId: string): Observable<GameMessage> {
    return this.connect().pipe(
        take(1),
        switchMap(() => {
            return new Observable<GameMessage>(observer => {
                console.log('Subscribing to chat topic:', `/topic/games/${gameId}/chat`);
                const subscription = this.client.subscribe(
                    `/topic/games/${gameId}/chat`,
                    (message) => {
                        try {
                            const gameMessage = JSON.parse(message.body);
                            observer.next(gameMessage);
                        } catch (error) {
                            console.error('Error parsing message:', error);
                        }
                    }
                );

                this.subscriptions.push(subscription);

                return () => {
                    if (subscription) {
                        subscription.unsubscribe();
                    }
                };
            });
        })
    );
}

sendGameMessage(message: any): void {
    this.connect().pipe(take(1)).subscribe({
        next: () => {
            console.log('Sending game message:', message);
            this.client.publish({
                destination: `/app/games/${message.gameId}/chat`,
                body: JSON.stringify(message)
            });
        },
        error: (err) => console.error('Error sending message:', err)
    });
}


  notifyOnlineStatus(isOnline: boolean): void {
    if (!this.connected || !this.client || !this.client.connected) {
      console.log('WebSocket non connecté, impossible de notifier le statut en ligne');
      return;
    }

    const currentUser = StorageService.getUser();
    if (!currentUser || !currentUser.nickname) {
      console.log('Aucun utilisateur connecté, impossible de notifier le statut en ligne');
      return;
    }

    const message = {
      playerNickname: currentUser.nickname,
      online: isOnline,
      type: 'PLAYER_STATUS'
    };

    console.log(`Notification de statut en ligne: ${currentUser.nickname} est ${isOnline ? 'en ligne' : 'hors ligne'}`);

    this.client.publish({
      destination: '/app/players/status',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message)
    });
  }

  subscribeToOnlineStatus(): void {
    if (!this.connected || !this.client) {
      console.log('WebSocket non connecté, impossible de s\'abonner aux statuts en ligne');
      return;
    }
    const subscription = this.client.subscribe('/topic/players/online', (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === 'ONLINE_PLAYERS' && Array.isArray(data.players)) {
          console.log('Liste des joueurs en ligne reçue:', data.players);
          this.onlinePlayersSubject.next(data.players);
        }
      } catch (e) {
        console.error('Erreur lors du parsing du message de statut en ligne:', e);
      }
    });
    this.subscriptions.push(subscription);
  }


}


