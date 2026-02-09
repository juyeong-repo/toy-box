import { IsEmail, IsString, MinLength } from 'class-validator';

/** 회원가입 요청 DTO - 이메일, 이름, 비밀번호 필수 */
export class SignupDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해 주세요.' })
  email!: string;

  @IsString({ message: '이름을 입력해 주세요.' })
  @MinLength(1, { message: '이름은 최소 1자 이상이어야 합니다.' })
  name!: string;

  @IsString({ message: '비밀번호를 입력해 주세요.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password!: string;
}
