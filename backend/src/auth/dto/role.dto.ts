import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  operatorId: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
