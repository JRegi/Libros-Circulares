import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
export declare class PublisherService {
    create(createPublisherDto: CreatePublisherDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updatePublisherDto: UpdatePublisherDto): string;
    remove(id: number): string;
}
