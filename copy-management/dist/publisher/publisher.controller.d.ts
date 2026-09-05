import { PublisherService } from './publisher.service';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
export declare class PublisherController {
    private readonly publisherService;
    constructor(publisherService: PublisherService);
    create(createPublisherDto: CreatePublisherDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updatePublisherDto: UpdatePublisherDto): string;
    remove(id: string): string;
}
