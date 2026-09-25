import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

// Users live in the user-management service, so their existence is
// checked over HTTP.
@Injectable()
export class UserClient {
  private readonly baseUrl =
    process.env.USER_MANAGEMENT_URL ?? 'http://localhost:3001';

  async ensureUserExists(userId: number) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/user/${userId}`);
    } catch {
      throw new ServiceUnavailableException('user-management is unreachable');
    }

    if (response.status === 404) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `user-management answered ${response.status}`,
      );
    }
  }
}
