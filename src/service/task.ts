import countryList from 'country-list';
import { Job } from 'bull';
import { TaskService, TeamSocialSiteType } from 'ba-common';
import { injectable, inject, decorate } from 'inversify';
import { ConnectionManager } from 'typeorm';
import wikiJS from 'wikijs';
import HLTV from 'hltv';
import TeamEntity from '../entity/team';
import GameEntity from '../entity/game';
import { ObjectId } from 'bson';
import { match } from 'minimatch';

const mediawikiUrls = {
  'starcraft-2': ['https://liquipedia.net/starcraft2/api.php'],
  'dota-2': ['https://liquipedia.net/dota2/api.php'],
  lol: ['https://liquipedia.net/leagueoflegends/api.php'],
  wc3: ['https://liquipedia.net/warcraft/api.php'],
};

@injectable()
export default class TeamTaskService extends TaskService {
  @inject('connectionmanager')
  private connectionManager: ConnectionManager;

  async fetchMediawikiTeamInfo(job?: Job) {
    try {
      this.logger.info(`Starting task:
      name: ${this.fetchMediawikiTeamInfo.name}
      id: ${job.id}`);

      const connection = this.connectionManager.get();
      const gameRepository = connection.getMongoRepository<GameEntity>(GameEntity);
      const teamRepository = connection.getMongoRepository<TeamEntity>(TeamEntity);

      const cursor = teamRepository.createEntityCursor();

      while (await cursor.hasNext()) {
        const team: TeamEntity = await cursor.next();
        const game = await gameRepository.findOneById(new ObjectId(team.gameId));

        if (!game) {
          continue;
        }

        const apiUrls = mediawikiUrls[game.slug]

        if (!apiUrls) {
          continue;
        }

        for (const apiUrl of apiUrls) {
          try {
            const client = await wikiJS({
              apiUrl,
            });

            const page = await client.page(team.name);

            const info : any = await page.info();

            if (info.name) {
              const already = team._keywords.find(k => k === info.name);

              if (!already) {
                team._keywords.push(info.name);
              }
            }

            if (info.location) {
              const countryCode = countryList().getCode(info.location);

              if (countryCode) {
                team.countryCode = countryCode;
              }
            }

            if (info.website) {
              const already = team.site === info.website;

              if (!already) {
                team.site = info.website;
              }
            }

            if (info.facebook) {
              const already = team.socialSites.find(s => s === info.facebook);

              if (!already) {
                team.socialSites.push({
                  type: TeamSocialSiteType.Facebook,
                  name: info.facebook,
                });
              }
            }

            if (info.twitter) {
              const already = team.socialSites.find(s => s === info.twitter);

              if (!already) {
                team.socialSites.push({
                  type: TeamSocialSiteType.Twitter,
                  name: info.twitter,
                });
              }
            }

            if (info.image) {
              try {
                const imagesURLS : string[] = await page.images();
                const mainImageURL = imagesURLS
                  .find(u => u.toLowerCase().includes(info.image.toLowerCase()));

                if (mainImageURL) {
                  team.logo = mainImageURL;
                }
              } catch (error) {
                this.logger.error(error);
              }
            }

            this.logger.info(team.name);
          } catch (error) {
            this.logger.error(error);
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async fetchHLTVTeamInfo(job?: Job) {
    try {
      this.logger.info(`Starting task:
      name: ${this.fetchMediawikiTeamInfo.name}
      id: ${job.id}`);

      const connection = this.connectionManager.get();
      const gameRepository = connection.getMongoRepository<GameEntity>(GameEntity);
      const teamRepository = connection.getMongoRepository<TeamEntity>(TeamEntity);

      const cursor = teamRepository.createEntityCursor();

      let matches = await HLTV.getMatches();

      matches = matches.filter(x => x)

      for (const match of matches) {
        try {
          if (match.team1.id) {
            const teamInfo = await HLTV.getTeam({ id: match.team1.id });
            const team = await teamRepository.findOne({ name: teamInfo.name });

            if (team) {
              team.logo = teamInfo.logo;
              await teamRepository.save(team);
            }
          }

          if (match.team2.id) {
            const teamInfo = await HLTV.getTeam({ id: match.team2.id });
            const team = await teamRepository.findOne({ name: teamInfo.name });

            if (team) {
              team.logo = teamInfo.logo;
              
              await teamRepository.save(team);
            }
          }
        } catch (error) {
          this.logger.error(error)
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
