import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../filters/http-exception.filter';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data &&
          'message' in data &&
          'result' in data
        ) {
          return data as ApiResponse<unknown>;
        }

        const statusCode = response.statusCode ?? HttpStatus.OK;
        let message = 'ok';
        let result: unknown[] = [];

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if ('message' in data) {
            message = String(
              (data as { message?: unknown }).message ?? message,
            );
          }

          if (
            'result' in data &&
            Array.isArray((data as { result?: unknown }).result)
          ) {
            result = (data as { result: unknown[] }).result;
          } else if ('data' in data) {
            const nested = (data as { data?: unknown }).data;
            result = Array.isArray(nested) ? nested : [nested];
          } else if (!('message' in data)) {
            result = [data];
          }
        } else if (data !== undefined) {
          result = Array.isArray(data) ? data : [data];
        }

        return {
          success: true,
          statusCode,
          message,
          result,
        };
      }),
    );
  }
}
